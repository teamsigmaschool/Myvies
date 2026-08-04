let express = require('express');
let app = express();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: 
    {
        rejectUnauthorized: false
    },
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Movie Watchlist API! Try GET /movies');
});

// Get all movies
app.get('/movies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM movies');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Get specific movie
app.get('/movies/unwatched', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM movies WHERE watched = false');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.post('/movies', async (req, res) => {
    const { title, genre } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO movies (title, genre) VALUES ($1, $2) RETURNING *',
            [title, genre]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.patch('/movies/:id', async (req, res) => {
    const { id } = req.params;
    const { title, genre, watched } = req.body;
    try {
        const result = await pool.query(
            'UPDATE movies SET title = $1, genre = $2, watched = $3 WHERE id = $4 RETURNING *',
            [title, genre, watched, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.delete('/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({ message: 'Movie deleted', movie: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(3000, () => {
    console.log('Movie Watchlist API listening on port 3000');
});