const express = require('express'); //use express.js to create a web server
const sql = require('mssql'); // use mssql to connect to SQL Server database
require('dotenv').config();   // must be the first line
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { trustServerCertificate: true },
};
const app = express(); // create express app instance
// port 3000 is the default port(address) for express.js, but you can change it to any other port if needed

app.use(express.json()); // lets Express read JSON sent in req.body (for POST/PUT) // middleware to parse incoming JSON requests
// route handlers for different endpoints
app.get('/', (req, res) => { 
res.send('<strong>Welcome to the Book Category API</strong>'); //
});

const categories = [
  { id: 1, name: 'Fiction' },
  { id: 2, name: 'Non-Fiction' },
  { id: 3, name: 'Biography' }
];



app.get('/categories', (req, res) => {
  console.log('Running get /categories');
  res.json(categories);
});


//hard-coded will stay in memory until the server is restarted. If you want to add a new category, 
// you can use the POST method to send a request to the server with the new category data. 
// The server will then add the new category to the categories array and return the updated list of categories.
/*
app.get('/categories', (req, res) => {
res.json([
{ id: 1, name: 'Fiction' },
{ id: 2, name: 'Non-Fiction' },
{ id: 3, name: 'Biography' }
]);
})
*/


app.get('/about', (req, res) => {
  res.send('Hi, I\'m Q. I\'m a software engineer learning Node.js and Express. I enjoy building web apps and figuring out how things work behind the scenes.');
});

app.get('/authors', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .query('SELECT AuthorID, Name FROM Author');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (closeError) { console.error('Error closing connection:', closeError); }
    }
  }
});

// GET /publishers  -> 200 list | 500
app.get('/publishers', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .query('SELECT PublisherID, Name FROM Publisher');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// GET /publishers/:id  -> 200 publisher | 400 | 404 | 500
app.get('/publishers/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('id', sql.SmallInt, id)
      .query('SELECT PublisherID, Name FROM Publisher WHERE PublisherID = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// POST /publishers  body { publisherId, name } -> 201 new | 400 | 409 | 500
app.post('/publishers', async (req, res) => {
  const { publisherId, name } = req.body;
  if (!Number.isInteger(publisherId) || !name) {
    return res.status(400).json({ error: 'publisherId (number) and name are required' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('publisherId', sql.SmallInt, publisherId)
      .input('name', sql.VarChar(50), name)
      .query('INSERT INTO Publisher (PublisherID, Name) OUTPUT INSERTED.* VALUES (@publisherId, @name)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    if (err.number === 2627) { // duplicate primary key
      return res.status(409).json({ error: 'Publisher ID already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT /publishers/:id  body { name } -> 200 updated | 400 | 404 | 500
app.put('/publishers/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });
  if (!name) return res.status(400).json({ error: 'name is required' });
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('id', sql.SmallInt, id)
      .input('name', sql.VarChar(50), name)
      .query('UPDATE Publisher SET Name = @name OUTPUT INSERTED.* WHERE PublisherID = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// DELETE /publishers/:id  -> 204 | 400 | 404 | 500
app.delete('/publishers/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('id', sql.SmallInt, id)
      .query('DELETE FROM Publisher WHERE PublisherID = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});


app.listen(3000, () => {
console.log('Listening on port 3000');
});

