// GIVEN — do not modify. Run with: npm test
const http = require('http');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../src/config');
const app = require('../src/app');
const db = require('../src/db');
const cache = require('../src/cache');
const { loans } = require('../src/data');

const tok = (sub, role) => jwt.sign({ sub, role }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const ALICE = tok('u1', 'member'), BOB = tok('u2', 'member'), ADMIN = tok('u3', 'librarian');
const auth = (t) => ({ Authorization: `Bearer ${t}` });

let server, port;
function call(method, path, { headers = {}, json, raw } = {}) {
  return new Promise((resolve, reject) => {
    const h = { ...headers };
    let payload = raw;
    if (json !== undefined) { payload = JSON.stringify(json); h['Content-Type'] = 'application/json'; }
    if (raw !== undefined) h['Content-Type'] = 'application/json';
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: h }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { let body = d; try { body = JSON.parse(d); } catch {} resolve({ status: res.statusCode, headers: res.headers, body }); });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

let passed = 0, failed = 0;
function check(ok, msg) { if (ok) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.log(`  ✗ ${msg}`); } }
async function safe(fn) { try { await fn(); } catch (e) { failed++; console.log(`  ✗ crashed: ${e.message}`); } }

async function main() {
  server = app.listen(0); port = server.address().port;

  console.log('\nTask 1 — requireRole');
  await safe(async () => {
    check((await call('GET', '/librarian/loans', { headers: auth(ADMIN) })).status === 200, 'librarian can open /librarian/loans (200)');
    const r = await call('GET', '/librarian/loans', { headers: auth(ALICE) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', 'member gets 403 FORBIDDEN on /librarian/loans');
    check((await call('GET', '/librarian/loans')).status === 401, 'no token gets 401');
    const p = await call('POST', '/books', { headers: auth(BOB), json: { title: 'X', author: 'Y' } });
    check(p.status === 403, 'member cannot create a book (403)');
  });

  console.log('\nTask 2 — ownership check (IDOR)');
  await safe(async () => {
    check((await call('GET', '/loans/l1', { headers: auth(ALICE) })).status === 200, 'alice reads her own loan (200)');
    const r = await call('GET', '/loans/l1', { headers: auth(BOB) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', "bob reading alice's loan gets 403 FORBIDDEN");
    check((await call('GET', '/loans/l1', { headers: auth(ADMIN) })).status === 200, 'librarian can read any loan (200)');
    const n = await call('GET', '/loans/l999', { headers: auth(BOB) });
    check(n.status === 404 && n.body.error && n.body.error.code === 'NOT_FOUND', 'missing loan gets 404 NOT_FOUND');
  });

  console.log('\nTask 3 — idempotent POST /loans');
  await safe(async () => {
    const body = { bookId: 'b1', days: 3 };
    const miss = await call('POST', '/loans', { headers: auth(ALICE), json: body });
    check(miss.status === 400 && miss.body.error && miss.body.error.code === 'IDEMPOTENCY_KEY_REQUIRED', 'no Idempotency-Key gets 400 IDEMPOTENCY_KEY_REQUIRED');
    const before = loans.length;
    const a = await call('POST', '/loans', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-1' }, json: body });
    check(a.status === 201 && a.body.id, 'new key creates a loan (201)');
    const b = await call('POST', '/loans', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-1' }, json: body });
    check(loans.length === before + 1, 'repeating the same key creates NO second loan');
    check(b.status === 201 && b.body.id === a.body.id, 'repeat returns the same status and the same loan id');
    const c = await call('POST', '/loans', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-2' }, json: body });
    check(c.status === 201 && c.body.id !== a.body.id && loans.length === before + 2, 'a different key creates a new loan');
  });

  console.log('\nTask 4 — cache the book list');
  await safe(async () => {
    cache.clear(); db.queryCount = 0;
    const a = await call('GET', '/books');
    check(a.headers['x-cache'] === 'MISS' && Array.isArray(a.body), '1st GET /books is X-Cache: MISS');
    const b = await call('GET', '/books');
    check(b.headers['x-cache'] === 'HIT', '2nd GET /books is X-Cache: HIT');
    check(db.queryCount === 1, 'the database was queried only once for two reads');
    await call('POST', '/books', { headers: auth(ADMIN), json: { title: 'New Book', author: 'Z' } });
    const c = await call('GET', '/books');
    check(c.headers['x-cache'] === 'MISS' && c.body.some((e) => e.title === 'New Book'), 'after POST /books the cache is cleared and the new book shows');
  });

  server.close();
  console.log(`\n  RESULT: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed — keep going.');
  process.exit(failed === 0 ? 0 : 1);
}
main();
