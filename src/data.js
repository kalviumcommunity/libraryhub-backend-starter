// GIVEN — do not modify. In-memory "database" — no real DB needed.

const users = [
  { id: 'u1', username: 'alice', password: 'alice-pass', role: 'member' },
  { id: 'u2', username: 'bob',   password: 'bob-pass',   role: 'member' },
  { id: 'u3', username: 'librarian', password: 'librarian-pass', role: 'librarian'  },
];

const books = [
  { id: 'b1', title: 'Clean Code', author: 'Robert Martin' },
  { id: 'b2', title: 'Deep Work', author: 'Cal Newport' },
];

// Every loan belongs to one user (userId).
const loans = [
  { id: 'l1', userId: 'u1', bookId: 'b1', days: 2, status: 'pending' }, // alice's loan
  { id: 'l2', userId: 'u2', bookId: 'b2', days: 1, status: 'pending' }, // bob's loan
];

// Used by Task 3: key -> { status, body }
const idempotency = new Map();

let loanCounter = loans.length;
const nextLoanId = () => `l${++loanCounter}`;

let bookCounter = books.length;
const nextBookId = () => `b${++bookCounter}`;

module.exports = { users, books, loans, idempotency, nextLoanId, nextBookId };
