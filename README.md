# LibraryHub Backend

A small Express API for lending library books. Four things are missing — finish them.

```bash
npm install
npm test
```

All tests fail/misbehave until you finish the tasks. See `question.md` for the task list.
Everything runs in memory: no database, no Redis, no keys, no internet.

| File | Task |
|---|---|
| `src/middleware/requireRole.js` | 1 |
| `src/routes/loans.js` (`GET /:id`) | 2 |
| `src/routes/loans.js` (`POST /`) | 3 |
| `src/routes/books.js` | 4 |
