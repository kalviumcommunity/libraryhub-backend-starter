// TASK 4 — Cache the book list (5 marks)
//
// GET /books runs db.getBooks() on EVERY request. The list rarely changes,
// so cache it (cache-aside), using the helper in ../cache (get / set / del):
//
//   GET /books
//     1. look in the cache under the key 'books:all'
//     2. HIT  -> set header  X-Cache: HIT   and return the cached list
//     3. MISS -> call db.getBooks(), cache it for 60 seconds,
//                set header  X-Cache: MISS  and return the list
//
//   POST /books (librarian)
//     after creating the book, delete 'books:all' from the cache so the next
//     GET shows the new book instead of a stale list.

const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const db = require('../db');
const cache = require('../cache');

router.get('/', (req, res) => {
  // TODO: add cache-aside here
  const books = db.getBooks();
  res.set('X-Cache', 'MISS');
  return res.json(books);
});

router.post('/', requireAuth, requireRole('librarian'), (req, res) => {
  const book = db.createBook({ title: req.body.title, author: req.body.author });
  // TODO: remove the stale cached list here
  return res.status(201).json(book);
});

module.exports = router;
