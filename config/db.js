const mysql = require('mysql2/promise');

// Cria o pool de conexões com o banco
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'lat_db',
    waitForConnections: true,
    connectionLimit: 10
});

// Exporta o pool
module.exports = pool;