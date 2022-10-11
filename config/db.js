const mysql = require('mysql')

const db = mysql.createConnection({
    host : "1.234.23.221",
    user : 'root',
    password : 'hello11!',
    port : 3306,
    database:'to_do_list',
    timezone: 'Asia/Seoul',
    charset: 'utf8mb4'
})
db.connect();

module.exports = db;