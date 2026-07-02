const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config();

const sql = fs.readFileSync('./logistik_db.sql', 'utf8');

const conn = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  multipleStatements: true,
});

conn.query(sql, (err, results) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('Database imported successfully.');
  conn.end();
});
