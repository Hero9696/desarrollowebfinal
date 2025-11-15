// server.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware para servir archivos estáticos (como tu index.html, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal para servir la interfaz de login
app.get('/', (req, res) => {
  // Asumiendo que guardaste tu HTML en una carpeta llamada 'public'
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor Express escuchando en http://localhost:${port}`);
  console.log(`Abre tu navegador en http://localhost:${port} para ver el login.`);
});