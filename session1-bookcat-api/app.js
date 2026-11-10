const express = require('express');
const app = express();
// ...your routes stay below


app.get('/', (req, res) => {
res.send('<strong>Welcome to the Book Category API</strong>');
});

app.get('/categories', (req, res) => {
res.json([
{ id: 1, name: 'Fiction' },
{ id: 2, name: 'Non-Fiction' },
{ id: 3, name: 'Biography' }
]);
})

app.get('/about', (req, res) => {
  res.send('Hi, I\'m Q. I\'m a software engineer learning Node.js and Express. I enjoy building web apps and figuring out how things work behind the scenes.');
});


app.listen(3000, () => {
console.log('Listening on port 3000');
});

