//DECLARAMOS LA CONEXION A LA BASE DE DATOS
const mysql = require('mysql');

const pool = mysql.createPool({

  host : process.env.CONFIG_DB_HOST,
  database : process.env.CONFIG_DB_NAME,
  user : process.env.CONFIG_DB_USER,
  password : process.env.CONFIG_DB_PASSWORD

});

module.exports = pool