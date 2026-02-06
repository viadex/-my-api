const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// Create (or open) the database file
const db = new Database('todos.db');

// Create the table if it doesn't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )
`);

// GET all todos
app.get('/api/todos', (req, res) => {
    const todos = db.prepare('SELECT * FROM todos').all();
    res.json(todos);
});

// GET single todo
app.get('/api/todos/:id', (req, res) => {
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
});

// CREATE a todo
app.post('/api/todos', (req, res) => {
    if (!req.body.task) return res.status(400).json({ error: 'Task is required' });

    const result = db.prepare('INSERT INTO todos (task) VALUES (?)').run(req.body.task);
    const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTodo);
});

// UPDATE a todo
app.put('/api/todos/:id', (req, res) => {
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const task = req.body.task || todo.task;
    const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : todo.done;

    db.prepare('UPDATE todos SET task = ?, done = ? WHERE id = ?').run(task, done, req.params.id);
    const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE a todo
app.delete('/api/todos/:id', (req, res) => {
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
    res.status(204).send();
});
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to my Todo API! Go to /api/todos to see todos.' });
});
app.listen(3000, () => {
    console.log('API running at http://localhost:3000');
});
