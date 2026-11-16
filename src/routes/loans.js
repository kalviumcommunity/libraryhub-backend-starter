const router = require('express').Router();
const { loans, idempotency, nextLoanId } = require('../data');

// All routes in this file are already behind requireAuth (see src/app.js),
// so req.user = { id, role } is always available.

// TASK 2 — Stop users reading other people's loans (5 marks)
//
// Right now any logged-in user can open ANY loan by guessing its id (an IDOR bug).
// Fix GET /loans/:id:
//   - loan does not exist                         -> 404 { error: { code: 'NOT_FOUND', message: '...' } }
//   - loan.userId !== req.user.id AND role != librarian -> 403 { error: { code: 'FORBIDDEN', message: '...' } }
//   - otherwise return the loan (200)
// Check 404 first, then ownership. Librarians may read any loan.
router.get('/:id', (req, res) => {
  const loan = loans.find((o) => o.id === req.params.id);
  // TODO: add the 404 check and the ownership check
  return res.json(loan);
});

// TASK 3 — Never create the same loan twice (5 marks)
//
// If the phone loses signal and the app retries "Borrow a book", we must not create
// two loans. Make POST /loans idempotent using the Idempotency-Key header:
//   1. no header                -> 400 { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '...' } }
//   2. key already used         -> return the SAME status and body saved before; create NO new loan
//   3. new key                  -> create exactly one loan, save { status, body } in the
//                                  `idempotency` Map under the key, and return it with 201
//
// Create a loan like this:
//   { id: nextLoanId(), userId: req.user.id, bookId: req.body.bookId, days: req.body.days, status: 'pending' }
// Push it into `loans`. Read the key from req.headers['idempotency-key'].
router.post('/', (req, res) => {
  // TODO: implement the three rules above. This stub creates a new loan every time.
  const loan = { id: nextLoanId(), userId: req.user.id, bookId: req.body.bookId, days: req.body.days, status: 'pending' };
  loans.push(loan);
  return res.status(201).json(loan);
});

module.exports = router;
