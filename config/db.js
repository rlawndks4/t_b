const mysql = require('mysql')

const db = mysql.createConnection({
    host : "119.205.233.214",
    user : 'root',
    password : 'qjfwk100djr!',
    port : 3306,
    database:'stock_investment_cost',
    timezone: 'Asia/Seoul',
    charset: 'utf8mb4'
})
db.connect();

module.exports = db;