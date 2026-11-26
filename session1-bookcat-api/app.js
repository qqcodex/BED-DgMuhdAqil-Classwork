const express = require('express'); //use express.js to create a web server
const sql = require('mssql'); // use mssql to connect to SQL Server database
const Joi = require('joi');
const copySchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).required()
});

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


/* -----------------------------------AUTHORS--------------------------------------- */
// SESSION 3 

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

// GET one author
app.get('/authors/:id', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid author id' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    const result = await request.query('SELECT AuthorID, Name FROM Author WHERE AuthorID = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// GET all books by an author with search parameter for author id (SESSION 4 EXTRAS)
app.get('/authors/:id/books', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid author id' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('authorId', sql.Int, req.params.id)
      .query(
        'SELECT b.* FROM Book b ' +
        'JOIN BookAuthor ba ON b.ISBN = ba.ISBN ' +
        'WHERE ba.AuthorID = @authorId'
      );
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});


// POST a new author
app.post('/authors', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', req.body.id);
    request.input('name', req.body.name);
    const result = await request.query(
      'INSERT INTO Author (AuthorID, Name) OUTPUT INSERTED.* VALUES (@id, @name)'
    );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT: change an author's name
app.put('/authors/:id', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid author id' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    request.input('name', req.body.name);
    const result = await request.query(
      'UPDATE Author SET Name = @name OUTPUT INSERTED.* WHERE AuthorID = @id'
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// DELETE an author
app.delete('/authors/:id', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid author id' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    const result = await request.query('DELETE FROM Author WHERE AuthorID = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

/* -----------------------------------PUBLISHER--------------------------------------- */

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

/* -----------------------------------BOOK--------------------------------------- */
// Lab 6 modified by Lab 10: GET all books 
app.get('/books', async (req, res) => {
  const { title } = req.query;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    let query = 'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book';
    if (title) {
      query += " WHERE Title LIKE '%' + @title + '%'";
      request.input('title', sql.VarChar(200), title);
    }
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
});

// GET one book by ISBN
app.get('/books/:isbn', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    const result = await request.query(
      'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book WHERE ISBN = @isbn'
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// get book by ISBN and include its authors
app.get('/books/:isbn/authors', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('isbn', sql.Char(10), req.params.isbn)
      .query(
            'SELECT a.* FROM Author a ' +
            'JOIN BookAuthor ba ON a.AuthorID = ba.AuthorID ' +
            'WHERE ba.ISBN = @isbn'
            );
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT: change a book's title (and other columns if needed)
app.put('/books/:isbn', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('isbn', sql.Char(10), req.params.isbn)
      .input('title', sql.VarChar(100), req.body.title)
      // ...one .input() per Book column
      .query(
        'UPDATE Book SET Title = @title /*, other columns */ ' +
        'OUTPUT INSERTED.* WHERE ISBN = @isbn'
      );
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Not found' });
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});


// POST a new book and its author, in one transaction
app.post('/books', async (req, res) => {
  const { isbn, title, yearPublish, publisherId, bookCat, authorId } = req.body;
  let connection;
  let transaction;
  try {
    connection = await sql.connect(dbConfig);
    transaction = new sql.Transaction(connection);
    await transaction.begin();

    const bookRequest = transaction.request();
    bookRequest.input('isbn', sql.Char(10), isbn);
    bookRequest.input('title', sql.VarChar(200), title);
    bookRequest.input('yearPublish', sql.Char(4), yearPublish);
    bookRequest.input('publisherId', sql.SmallInt, publisherId);
    bookRequest.input('bookCat', sql.Char(2), bookCat);
    const bookResult = await bookRequest.query(
      'INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat) ' +
      'OUTPUT INSERTED.* VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)'
    );

    const authorRequest = transaction.request();
    authorRequest.input('isbn', sql.Char(10), isbn);
    authorRequest.input('authorId', sql.SmallInt, authorId);
    await authorRequest.query(
      'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
    );

    await transaction.commit();
    res.status(201).json(bookResult.recordset[0]);
  } catch (err) {
    console.error(err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error(rollbackErr);
      }
    }
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

// GET one copy of a book
app.get('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    const result = await request.query(
      'SELECT ISBN, CopyNo, RentalRate, Status FROM BookCopy ' +
      'WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

/* -----------------------------------RENTAL--------------------------------------- */
// PUT: change one copy's rental rate
app.put('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    request.input('rentalRate', sql.SmallMoney, req.body.rentalRate);
    const result = await request.query(
      'UPDATE BookCopy SET RentalRate = @rentalRate OUTPUT INSERTED.* ' +
      'WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});


// DELETE one copy of a book
app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    const result = await request.query(
      'DELETE FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) await connection.close();
  }
});

/* -----------------------------------VALIDATION (session 4)--------------------------------------- */
//STEP1: checkAvailable looks the copy up. It gives back null if there is no such copy,
//  true if it is free (Status 'D') and false if it is taken.
async function checkAvailable(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query('SELECT Status FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo');
    if (result.recordset.length === 0) return null;
    return result.recordset[0].Status === 'D';
  } finally {
    if (connection) await connection.close();
  }
}

//STEP2: Step 2: The write helper function markRented 
// sets the copy's Status to 'M'.
async function markRented(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection.request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query("UPDATE BookCopy SET Status = 'M' WHERE ISBN = @isbn AND CopyNo = @copyNo");
  } finally {
    if (connection) await connection.close();
  }
}

//STEP2: Step 2: The write helper function markReturned 
// sets the copy's Status to 'D'.
async function markReturned(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection.request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query("UPDATE BookCopy SET Status = 'D' WHERE ISBN = @isbn AND CopyNo = @copyNo");
  } finally {
    if (connection) await connection.close();
  }
}

//LAB 8 Step 3: The rent route. The route calls the check, 
// reads its answer, and only then calls the write.
app.put('/books/:isbn/copies/:copyNo/rent', async (req, res) => {
  const { error, value } = copySchema.validate(req.params);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const isbn = value.isbn;
  const copyNo = value.copyNo;
  try {
    const available = await checkAvailable(isbn, copyNo);
    if (available === null) return res.status(404).json({ error: 'Not found' });
    if (available === false) return res.status(409).json({ error: 'Copy is already rented' });
    await markRented(isbn, copyNo);
    res.status(200).json({ ISBN: isbn, copyNo: copyNo, Status: 'M' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//LAB 8 Step 3: The return route. The route calls the check,
// reads its answer, and only then calls the write.
//Same shape as rent, the other way round: a copy that is already free can't be returned
app.put('/books/:isbn/copies/:copyNo/return', async (req, res) => {
  const { error, value } = copySchema.validate(req.params);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const available = await checkAvailable(value.isbn, value.copyNo);
    if (available === null) return res.status(404).json({ error: 'Not found' });
    if (available === true) return res.status(409).json({ error: 'Copy is not rented' });
    await markReturned(value.isbn, value.copyNo);
    res.status(200).json({ ISBN: value.isbn, copyNo: value.copyNo, Status: 'D' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => {
console.log('Listening on port 3000');
});

