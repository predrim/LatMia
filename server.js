const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/caes', (req, res) => {
    res.render('dogs');
});

app.get('/gatos', (req, res) => {
    res.render('cats');
});

app.listen(3000, () => console.log('Rodando em http://localhost:3000'));