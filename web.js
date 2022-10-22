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
const nodemailer = require('nodemailer');

const { checkLevel, logRequestResponse, isNotNullOrUndefined, namingImagesPath, nullResponse, lowLevelResponse, response, returnMoment } = require('./util')
const schedule = require('node-schedule');
const { dbQueryList } = require('./query-util')
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
//multer
const { upload } = require('./config/multerConfig')

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
                ca: fs.readFileSync("/etc/letsencrypt/live/todoornot.site/fullchain.pem"),
                key: fs.readFileSync("/etc/letsencrypt/live/todoornot.site/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/todoornot.site/cert.pem")
        };
        https.createServer(options, app).listen(HTTPS_PORT, console.log("Server on " + HTTPS_PORT));

}

schedule.scheduleJob('0 0/1 * * * *', async function () {
        console.log(returnMoment());
        let date = returnMoment().substring(0, 10);
        let dayOfWeek = new Date(date).getDay()
        let result = await dbQueryList(`SELECT todo_table.*, user_table.*  FROM todo_table LEFT JOIN user_table ON todo_table.user_pk=user_table.pk WHERE DATE_SUB(CONCAT(select_date, ' ', start_time), INTERVAL minute_ago MINUTE)=? `, [returnMoment()]);
        let list = result?.result ?? [];
        for (var i = 0; i < list.length; i++) {
                let name = list[i]?.name;
                let note = `${name}님\n`;
                if (list[i].lat > 0) {
                        note += `${list[i]?.place}에서`
                }
                note += `${list[i]?.start_date} 부터 ${list[i]?.end_date} 까지 ${list[i]?.tag} 스케줄이 있습니다.`
                let title = `${name}님 알림입니다.`;
                const transporter = nodemailer.createTransport({
                        service: 'naver',
                        host: 'smtp.naver.com',  // SMTP 서버명
                        port: 465,  // SMTP 포트
                        auth: {
                                user: process.env.NODEMAILER_USER,  // 네이버 아이디
                                pass: process.env.NODEMAILER_PASS,  // 네이버 비밀번호
                        },
                });
                const mailOptions = {
                        from: process.env.NODEMAILER_USER,  // 네이버 아이디
                        to: list[i]?.email,  // 수신자 아이디
                        subject: title,
                        html: note,
                };

                transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                                console.log(err);
                        } else {
                                console.log('Successfully Send Email.', info.response);
                                transporter.close()
                        }
                });
        }
})

// Default route for server status
app.get('/', (req, res) => {
        res.json({ message: `Server is running on port ${req.secure ? HTTPS_PORT : HTTP_PORT}` });
});