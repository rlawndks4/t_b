const fs = require('fs')
const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const db = require('./config/db')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const https = require('https')
const port = 8001;
app.use(cors());
const http = require('http')
require('dotenv').config()
//passport, jwt
const jwt = require('jsonwebtoken')
const { checkLevel, logRequestResponse, isNotNullOrUndefined, namingImagesPath, nullResponse, lowLevelResponse, response } = require('./util')

app.use(bodyParser.json({limit:'100mb'})); 
app.use(bodyParser.urlencoded({extended:true, limit:'100mb'})); 
//multer
const {upload} = require('./config/multerConfig')

//express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(passport.initialize());
// app.use(passport.session());
// passportConfig(passport);


const path = require('path');
app.set('/routes', __dirname + '/routes');
app.use('/config', express.static(__dirname + '/config'));
//app.use('/image', express.static('./upload'));
app.use('/image', express.static(__dirname + '/image'));
app.use('/api', require('./routes/router'))

app.get('/', (req, res) => {
    console.log("back-end initialized")
    res.send('back-end initialized')
});
const is_test = true;

const HTTP_PORT = 8001;
const HTTPS_PORT = 8443;

if (is_test) {
        http.createServer(app).listen(HTTP_PORT), console.log("Server on " + HTTP_PORT);

} else {
        const options = { // letsencrypt로 받은 인증서 경로를 입력해 줍니다.
                ca: fs.readFileSync("/etc/letsencrypt/live/masterpick.co.kr/fullchain.pem"),
                key: fs.readFileSync("/etc/letsencrypt/live/masterpick.co.kr/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/masterpick.co.kr/cert.pem")
        };
        https.createServer(options, app).listen(HTTPS_PORT, console.log("Server on " + HTTPS_PORT));

}


// Default route for server status
app.get('/', (req, res) => {
        res.json({ message: `Server is running on port ${req.secure ? HTTPS_PORT : HTTP_PORT}` });
});