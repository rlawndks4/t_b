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
const HTTP_PORT = 8001; const HTTPS_PORT = 8443; 
//const options = { key: fs.readFileSync('../ssl/cert.key'), cert: fs.readFileSync('../ssl/cert.crt') };

app.post('/api/addad', upload.single('image'), (req, res) =>{
        try{
                
                if(checkLevel(req.cookies.token, 40))
                {
                        
                        const sql = 'INSERT INTO ad_table  (title, image_src) VALUES (? , ?)'
                        const title = req.body.title
                        const {image, isNull} = namingImagesPath("ad", req.file)
                        const param = [title, image]
                        console.log(req.file)        
                                db.query(sql, param, (err, rows, feild)=>{
                                        if (err) {
                                                
                                                console.log(err)
                                                response(req, res, -200, "광고 추가 실패", [])
                                        }
                                        else {
                                                
                                                response(req, res, 200, "광고 추가 성공", [])
                                        }
                                })
                }
                else
                        lowLevelResponse(req, res)
        }
        catch(err)
        {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
        }
})
//가게 사진 추가
app.post('/api/addimage', upload.single('image'), (req, res) =>{
        try{
                
                if(checkLevel(req.cookies.token, 40))
                {
                        
                        const sql = 'INSERT INTO image_table (shop_pk, image_src) VALUES (? , ?)'
                        const pk = req.body.pk
                        const {image, isNull} = namingImagesPath("ad", req.file)
                        const param = [pk, image]
                        
                        console.log(req.file)  
                                
                                db.query(sql, param, (err, rows, feild)=>{
                                        if (err) {
                                                
                                                console.log(err)
                                                response(req, res, -200, "이미지 추가 실패", [])
                                        }
                                        else {
                                                
                                                response(req, res, 200, "이미지 추가 성공", [])
                                        }
                                })
                }
                else
                        lowLevelResponse(req, res)
        }
        catch(err)
        {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
        }
})
http.createServer(app).listen(HTTP_PORT,console.log("Server on "+HTTP_PORT)); 
//https.createServer(options, app).listen(HTTPS_PORT);
