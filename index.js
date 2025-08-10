require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json());

// Home
app.get('/', (req, res) => {
  res.send('Welcome to the Notes App!');
});

// List all notes
app.get('/notes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a note
app.post('/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single note
app.get('/notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});