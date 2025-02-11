const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

http.createServer(app).listen(PORT, () => {
    console.log(`Servidor HTTP rodando em http://localhost:${PORT}`);
});