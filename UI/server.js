// server.js
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || 3051;


const app = express();
app.use(cors());
// Статические файлы
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


app.listen(port, () => {
    console.log(`-Сервер запущен на порту ${port}`);
});