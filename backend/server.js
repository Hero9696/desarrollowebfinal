// server.js
const express = require('express');
const path = require('path');
const sql = require('mssql'); // Importamos el módulo mssql
const app = express();
const port = 3000;
const cors = require('cors');

// Configuración de la Conexión a SQL Server (SECRETO - SOLO EN EL BACKEND)
const config = {
    user: 'usr_DesaWebDevUMG',
    password: '!ngGuast@360',
    server: 'svr-sql-ctezo.southcentralus.cloudapp.azure.com',
    database: 'db_DesaWebDevUMG',
    options: {
        encrypt: true, // Usar 'true' si SQL Server requiere SSL
        trustServerCertificate: true // Necesario para certificados auto-firmados en Azure
    }
};

app.use(cors({
    // Usa la URL exacta de tu sitio en GitHub Pages
    // ¡REEMPLAZA ESTOS VALORES!
    origin: 'https://Hero9696.github.io/desarrollowebfinal', 
    methods: ['GET', 'POST']
}));
app.use(express.static(path.join(__dirname, '..'))); 
// '__dirname' (backend/) + '..' (sube a la raíz) = /opt/render/project/src/

// Ruta principal para servir la interfaz de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html')); 
  // '__dirname' (backend/) + '..' (sube a la raíz) + 'index.html' = /opt/render/project/src/index.html
});

// NUEVA RUTA: 2. Petición GET para obtener mensajes del chat
app.get('/api/mensajes-chat', async (req, res) => {
    try {
        // Conectarse a la base de datos
        await sql.connect(config);
        
        // 3. Consultar la tabla [dbo].[Chat_Mensaje]
        const result = await sql.query`
            SELECT TOP 50 Cod_Sala, Login_Emisor, Contenido, Fecha_Envio, Estado
            FROM [dbo].[Chat_Mensaje]
            ORDER BY Fecha_Envio DESC -- Los más recientes primero
        `;

        // Cerrar la conexión
        await sql.close();

        // Enviar los mensajes al frontend
        res.json(result.recordset);

    } catch (err) {
        console.error("Error al conectar o consultar SQL Server:", err);
        // Asegúrate de cerrar la conexión en caso de error
        sql.close();
        res.status(500).json({ 
            message: "Error al obtener mensajes del servidor.",
            detail: err.message
        });
    }
});
const PORT = process.env.PORT || 3000;
// Inicializar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express escuchando en http://localhost:${PORT}`);
});