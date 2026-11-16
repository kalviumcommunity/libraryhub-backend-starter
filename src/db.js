// GIVEN — do not modify.
// Pretend database for books. Every call to getBooks() is one "database query".
// Tests read queryCount to see how many times your code hit the database.

const { books, nextBookId } = require('./data');

const db = {
  queryCount: 0,
  getBooks() {
    db.queryCount++;
    return books.map((e) => ({ ...e }));
  },
  createBook({ title, author }) {
    const book = { id: nextBookId(), title, author };
    books.push(book);
    return { ...book };
  },
};

module.exports = db;
