const express = require('express'); //use express.js to create a web server
const app = express(); // create express app instance
// port 3000 is the default port(address) for express.js, but you can change it to any other port if needed


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


app.listen(3000, () => {
console.log('Listening on port 3000');
});

