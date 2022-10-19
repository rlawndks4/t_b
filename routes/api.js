const express = require('express')
//const { json } = require('body-parser')
const router = express.Router()
const cors = require('cors')
router.use(cors())
router.use(express.json())

const crypto = require('crypto')
//const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { checkLevel, getSQLnParams, getUserPKArrStrWithNewPK,
    isNotNullOrUndefined, namingImagesPath, nullResponse,
    lowLevelResponse, response, removeItems, returnMoment, formatPhoneNumber
} = require('../util')
const {
    getRowsNumWithKeyword, getRowsNum, getAllDatas,
    getDatasWithKeywordAtPage, getDatasAtPage,
    getKioskList, getItemRows, getItemList, dbQueryList, dbQueryRows
} = require('../query-util')

const db = require('../config/db')
const { upload } = require('../config/multerConfig')
const { Console } = require('console')
const { abort } = require('process')
const axios = require('axios')
//const { pbkdf2 } = require('crypto')
const salt = "435f5ef2ffb83a632c843926b35ae7855bc2520021a73a043db41670bfaeb722"
const saltRounds = 10
const pwBytes = 64
const jwtSecret = "djfudnsqlalfKeyFmfRkwu"
const request = require('request')
const geolocation = require('geolocation')
const kakaoOpt = {
    clientId: '4a8d167fa07331905094e19aafb2dc47',
    redirectUri: 'http://172.30.1.19:8001/api/kakao/callback',
};
router.get('/', (req, res) => {
    console.log("back-end initialized")
    res.send('back-end initialized')
});


const nodemailer = require('nodemailer');


const onSignUp = async (req, res) => {
    try {
        //logRequest(req)
        const id = req.body.id ?? "";
        const pw = req.body.pw ?? "";
        const email = req.body.email ?? "";
        const name = req.body.name ?? "";
        const user_level = req.body.user_level ?? 0;
        //중복 체크 
        let sql = "SELECT * FROM user_table WHERE id=?"

        db.query(sql, [id], (err, result) => {
            let users = result ?? [];
            if (users.length > 0)
                response(req, res, -200, "ID가 중복됩니다.", [])
            else {
                crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
                    // bcrypt.hash(pw, salt, async (err, hash) => {
                    let hash = decoded.toString('base64')

                    if (err) {
                        console.log(err)
                        response(req, res, -200, "비밀번호 암호화 도중 에러 발생", [])
                    }

                    sql = 'INSERT INTO user_table (id, pw, email, name, user_level) VALUES (?, ?, ?, ?, ?)'
                    await db.query(sql, [id, hash, email, name, user_level], async (err, result) => {

                        if (err) {
                            console.log(err)
                            response(req, res, -200, "회원 추가 실패", [])
                        }
                        else {

                            response(req, res, 200, "회원 추가 성공", [])

                        }
                    })
                })
            }
        })

    }
    catch (err) {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
    }
}
const onLoginById = async (req, res) => {
    try {
        let { id, pw } = req.body;
        db.query('SELECT * FROM user_table WHERE id=?', [id], async (err, result1) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result1.length > 0) {
                    await crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
                        // bcrypt.hash(pw, salt, async (err, hash) => {
                        let hash = decoded.toString('base64');
                        if (hash == result1[0].pw) {
                            try {
                                const token = jwt.sign({
                                    pk: result1[0].pk,
                                    id: result1[0].id,
                                    user_level: result1[0].user_level,
                                    email: result1[0].email,
                                },
                                    jwtSecret,
                                    {
                                        expiresIn: '600m',
                                        issuer: 'fori',
                                    });
                                res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 * 10 });
                                return response(req, res, 200, '환영합니다.', result1[0]);
                            } catch (e) {
                                console.log(e)
                                return response(req, res, -200, "서버 에러 발생", [])
                            }
                        } else {
                            console.log(1)
                            return response(req, res, -100, "없는 회원입니다.", [])

                        }
                    })
                } else {
                    console.log(2)
                    return response(req, res, -100, "없는 회원입니다.", [])
                }
            }
        })

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onLoginBySns = (req, res) => {
    try {
        let { id, typeNum, name, nickname, phone, user_level, profile_img } = req.body;
        db.query("SELECT * FROM user_table WHERE id=? AND type=?", [id, typeNum], async (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result.length > 0) {//기존유저
                    let token = jwt.sign({
                        pk: result[0].pk,
                        id: result[0].id,
                        user_level: result[0].user_level,
                        email: result[0].email,
                    },
                        jwtSecret,
                        {
                            expiresIn: '600m',
                            issuer: 'fori',
                        });
                    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 * 10 });
                    await db.query('UPDATE user_table SET last_login=? WHERE pk=?', [returnMoment(), result[0].pk], (err, result) => {
                        if (err) {
                            console.log(err)
                            return response(req, res, -200, "서버 에러 발생", [])
                        }
                    })
                    return response(req, res, 200, result[0].nickname + ' 님 환영합니다.', result[0]);
                } else {//신규유저
                    await db.query("INSERT INTO user_table (id, name, nickname , phone, user_level, type,profile_img) VALUES (?,  ?, ?, ?, ?, ?, ?)", [id, name, nickname, phone, user_level, typeNum, profile_img], async (err, result2) => {
                        if (err) {
                            console.log(err)
                            return response(req, res, -200, "서버 에러 발생", [])
                        } else {
                            await db.query("UPDATE user_table SET sort=? WHERE pk=?", [result2?.insertId, result2?.insertId], async (err, resultup) => {
                                if (err) {
                                    console.log(err)
                                    response(req, res, -200, "회원 추가 실패", [])
                                }
                                else {
                                    let token = jwt.sign({
                                        pk: result2?.insertId,
                                        id: id,
                                        user_level: user_level,
                                        email: email
                                    },
                                        jwtSecret,
                                        {
                                            expiresIn: '600m',
                                            issuer: 'fori',
                                        });
                                    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 * 10 });
                                    db.query('UPDATE user_table SET last_login=? WHERE pk=?', [returnMoment(), result2?.insertId], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                            return response(req, res, -200, "서버 에러 발생", [])
                                        }
                                    })
                                    return response(req, res, 200, nickname + ' 님 환영합니다.', { pk: result2?.insertId, id, typeNum, name, nickname, phone, user_level, profile_img });
                                }
                            })
                        }
                    })
                }
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onLoginByPhone = (req, res) => {
    try {

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getUserContent = (req, res) => {
    try {
        let { pk } = req.query;
        db.query("SELECT * FROM user_table WHERE pk=?", [pk], (err, result1) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                db.query("SELECT user_master_connect_table.*, master_table.pk AS master_pk, master_table.name AS master_name, master_table.profile_img FROM user_master_connect_table LEFT JOIN master_table ON user_master_connect_table.master_pk=master_table.pk WHERE user_master_connect_table.user_pk=? ORDER BY user_master_connect_table.pk DESC", [pk], (err, result2) => {
                    if (err) {
                        console.log(err)
                        return response(req, res, -200, "서버 에러 발생", [])
                    } else {
                        return response(req, res, 100, "success", { user: result1[0], subscribes: result2 })
                    }
                })
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}


const editMyInfo = (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0)
        let { pw, email } = req.body;
        crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
            // bcrypt.hash(pw, salt, async (err, hash) => {
            let hash = decoded.toString('base64')

            if (err) {
                console.log(err)
                response(req, res, -200, "비밀번호 암호화 도중 에러 발생", [])
            }
            await db.query("UPDATE user_table SET pw=?, email=? WHERE id=?", [hash, email, decode.id], (err, result) => {
                if (err) {
                    console.log(err)
                    return response(req, res, -200, "서버 에러 발생", [])
                } else {
                    return response(req, res, 100, "성공적으로 저장되었습니다. 다시 로그인 해주세요.", [])
                }
            })
        })


    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const kakaoCallBack = (req, res) => {
    try {
        const token = req.body.token;
        async function kakaoLogin() {
            let tmp;

            try {
                const url = 'https://kapi.kakao.com/v2/user/me';
                const Header = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
                tmp = await axios.get(url, Header);
            } catch (e) {
                console.log(e);
                response(req, res, -200, "서버 에러 발생", [])
            }

            try {
                const { data } = tmp;
                const { id, properties } = data;
                await db.query("SELECT * FROM user_table WHERE id=?", [id], async (err, result) => {
                    if (err) {
                        console.log(err);
                        response(req, res, -100, "서버 에러 발생", [])
                    } else {
                        if (result.length > 0) {
                            if (err) {
                                console.log(err);
                                response(req, res, -100, "서버 에러 발생", [])
                            } else {
                                response(req, res, 100, "기존유저", { phone: result[0]?.phone ?? "", pk: result[0]?.pk ?? 0 })
                            }

                        } else {
                            response(req, res, 100, "신규유저", { id: id })
                        }
                    }
                })
            } catch (e) {
                console.log(e);
                response(req, res, -100, "서버 에러 발생", [])
            }

        }
        kakaoLogin();

    } catch (err) {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
    }
}
const getMyInfo = (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0)
        db.query("SELECT * FROM user_table WHERE pk=?", [decode.pk], (err, result) => {
            if (err) {
                console.log(err);
                response(req, res, -100, "서버 에러 발생", [])
            } else {
                if (result?.length > 0) {
                    response(req, res, 100, "success", result[0])

                } else {
                    response(req, res, 100, "없는 유저 입니다.", [])
                }
            }
        })
    } catch (err) {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
    }
}
const updateCheckIsMonday = (req, res) => {
    try {
        let check = req.body.check;
        const decode = checkLevel(req.cookies.token, 0)
        db.query("UPDATE user_table SET is_monday=? WHERE pk=?", [check, decode.pk], (err, result) => {
            if (err) {
                console.log(err);
                response(req, res, -100, "서버 에러 발생", [])
            } else {
                if (result?.length > 0) {
                    response(req, res, 100, "success", result[0])

                } else {
                    response(req, res, 100, "없는 유저 입니다.", [])
                }
            }
        })
    } catch (err) {
        console.log(err)
        response(req, res, -200, "서버 에러 발생", [])
    }
}

const sendAligoSms = ({ receivers, message }) => {
    return axios.post('https://apis.aligo.in/send/', null, {
        params: {
            key: 'xbyndmadqxp8cln66alygdq12mbpj7p7',
            user_id: 'firstpartner',
            sender: '1522-1233',
            receiver: receivers.join(','),
            msg: message
        },
    }).then((res) => res.data).catch(err => {
        console.log('err', err);
    });
}
const sendSms = (req, res) => {
    try {
        let receiver = req.body.receiver;
        const content = req.body.content;
        sendAligoSms({ receivers: receiver, message: content }).then((result) => {
            if (result.result_code == '1') {
                return response(req, res, 100, "success", [])
            } else {
                return response(req, res, -100, "fail", [])
            }
        });
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const findIdByPhone = (req, res) => {
    try {
        const phone = req.body.phone;
        db.query("SELECT pk, id FROM user_table WHERE phone=?", [phone], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "success", result[0])
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const findAuthByNameAndEmail = (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        console.log(req.body)
        db.query("SELECT * FROM user_table WHERE name=? AND email=?", [name, email], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result.length > 0) {
                    return response(req, res, 100, "success", result[0]);
                } else {
                    return response(req, res, -50, "등록되지 않은 회원입니다.", []);
                }
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const findPwByNameAndId = (req, res) => {
    try {
        const name = req.body.name;
        const id = req.body.id;
        db.query("SELECT * FROM user_table WHERE name=? AND id=?", [name, id], async (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result.length > 0) {
                    let pw = "";
                    for (var i = 0; i < 6; i++) {
                        pw += Math.floor(Math.random() * 10).toString();
                    }
                    await crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
                        // bcrypt.hash(pw, salt, async (err, hash) => {
                        if (err) {
                            return response(req, res, -200, "서버 에러 발생", [])
                        }
                        let hash = decoded.toString('base64');
                        await db.query("UPDATE user_table SET pw=? WHERE id=?", [hash, id], (err, result) => {
                            if (err) {
                                console.log(err)
                                return response(req, res, -100, "fail", []);
                            } else {
                                return response(req, res, 100, "임시 비밀번호가 메일로 전송되었습니다.", []);
                            }
                        })
                    })
                    // 메일발송 함수
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
                        to: result[0].email,  // 수신자 아이디
                        subject: '[Todo or Not] 임시 비밀번호 설정',
                        html: `${name}님의 임시 비밀번호는 '${pw}' 입니다.`,
                    };

                    await transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Successfully Send Email.', info.response);
                            transporter.close()
                        }
                    });
                } else {
                    return response(req, res, -50, "등록되지 않은 회원입니다.", []);
                }
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const checkExistId = (req, res) => {
    try {
        const id = req.body.id;
        db.query(`SELECT * FROM user_table WHERE id=? `, [id], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result.length > 0) {
                    return response(req, res, -50, "이미 사용중인 아이디입니다.", []);
                } else {
                    return response(req, res, 100, "사용가능한 아이디입니다.", []);
                }
            }
        })

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const checkExistNickname = (req, res) => {
    try {
        const nickname = req.body.nickname;
        db.query(`SELECT * FROM user_table WHERE nickname=? `, [nickname], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                if (result.length > 0) {
                    return response(req, res, -50, "이미 사용중인 닉네임입니다.", []);
                } else {
                    return response(req, res, 100, "사용가능한 닉네임입니다.", []);
                }
            }
        })

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const checkPw = (req, res) => {
    try {
        let pw = req.body.pw;
        const decode = checkLevel(req.cookies.token, 0)
        db.query("SELECT * FROM user_table WHERE id=?", [decode.id], async (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                await crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
                    // bcrypt.hash(pw, salt, async (err, hash) => {
                    let hash = decoded.toString('base64')

                    if (err) {
                        console.log(err)
                        response(req, res, -200, "비밀번호 암호화 도중 에러 발생", [])
                    }
                    if (hash == result[0].pw) {
                        return response(req, res, 100, "success", [])
                    } else {
                        return response(req, res, -50, "비밀번호가 일치하지 않습니다.", [])
                    }
                })
            }
        })

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const changePassword = (req, res) => {
    try {
        const id = req.body.id;
        let pw = req.body.pw;
        crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
            // bcrypt.hash(pw, salt, async (err, hash) => {
            let hash = decoded.toString('base64')

            if (err) {
                console.log(err)
                response(req, res, -200, "비밀번호 암호화 도중 에러 발생", [])
            }

            await db.query("UPDATE user_table SET pw=? WHERE id=?", [hash, id], (err, result) => {
                if (err) {
                    console.log(err)
                    return response(req, res, -200, "서버 에러 발생", [])
                } else {
                    return response(req, res, 100, "success", [])
                }
            })
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getUserToken = (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0)
        if (decode) {
            let id = decode.id;
            let pk = decode.pk;
            let email = decode.email;
            let user_level = decode.user_level;
            res.send({ id, pk, user_level, email })
        }
        else {
            res.send({
                pk: -1,
                user_level: -1
            })
        }
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onLogout = (req, res) => {
    try {
        res.clearCookie('token')
        //res.clearCookie('rtoken')
        return response(req, res, 200, "로그아웃 성공", [])
    }
    catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const addTodo = (req, res) => {
    try {
        let { title, category, select_date, start_time, end_time, tag, minute_ago, place, lat, lng, user_pk } = req.body;
        let sql = "INSERT INTO todo_table (title, category, select_date, start_time, end_time, tag, minute_ago, place, lat, lng, user_pk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [title, category, select_date, start_time, end_time, tag, minute_ago, place, lat, lng, user_pk], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "success", [])
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const updateTodo = (req, res) => {
    try {
        let { title, category, select_date, start_time, end_time, tag, minute_ago, place, lat, lng, pk } = req.body;
        let sql = "UPDATE todo_table SET title=?, category=?, select_date=?, start_time=?, end_time=?, tag=?, minute_ago=?, place=?, lat=?, lng=? WHERE pk=?";
        db.query(sql, [title, category, select_date, start_time, end_time, tag, minute_ago, place, lat, lng, pk], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "성공적으로 저장되었습니다.", [])
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getTodoList = (req, res) => {
    try {
        let { select_date, user_pk } = req.body;
        db.query("SELECT * FROM todo_table WHERE select_date=? AND user_pk=? ORDER BY date ASC", [select_date, user_pk], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "success", result)
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const changeStatus = (req, res) => {
    try {
        let { pk, status } = req.body;
        db.query("UPDATE todo_table SET status=? WHERE pk=?", [status, pk], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "success", result)
            }
        })

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getToDoListStatistics = async (req, res) => {
    try {
        let { list, user_pk } = req.body;
        let day_list = "";
        for (var i = 0; i < list.length; i++) {
            if (i == 0) {
                day_list += `'${list[i]}'`;
            } else {
                day_list += `,'${list[i]}'`;
            }
        }
        let sql = `SELECT * FROM todo_table WHERE user_pk=${user_pk} AND select_date IN(${day_list})`;
        await db.query(sql, (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "success", result)
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getAddressByText = async (req, res) => {
    try {
        let { text } = req.body;
        let client_id = 'pmfxkd4ept';
        let client_secret = 't2HIUfZOkme7FF0JdIxfdwYI92cl2R5GKpMBa7Nj';
        let api_url = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode'; // json

        const coord = await axios.get(`${api_url}`, {
            params: {
                query: text,
            },
            headers: {
                "X-NCP-APIGW-API-KEY-ID": `${client_id}`,
                "X-NCP-APIGW-API-KEY": `${client_secret}`,
            },
        })
        if (!coord.data.addresses) {
            return response(req, res, 100, "success", []);
        } else {
            let result = [];
            for (var i = 0; i < coord.data.addresses.length; i++) {
                result[i] = {
                    lng: coord.data.addresses[i].x,
                    lat: coord.data.addresses[i].y,
                    road_address: coord.data.addresses[i].roadAddress,
                    address: coord.data.addresses[i].jibunAddress
                }
            }
            return response(req, res, 100, "success", result);
        }
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const deleteToto = (req, res) => {
    try {
        let { pk } = req.params;
        db.query("DELETE FROM todo_table WHERE pk=?", [pk], (err, result) => {
            if (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
            } else {
                return response(req, res, 100, "성공적으로 삭제 되었습니다.", [])
            }
        })
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
module.exports = {
    onLoginById, getUserToken, onLogout, checkExistId, checkExistNickname, checkPw, sendSms, kakaoCallBack, editMyInfo, onLoginBySns,//auth
    findIdByPhone, findAuthByNameAndEmail, findPwByNameAndId, getUserContent, getTodoList, getToDoListStatistics, getMyInfo,//select
    onSignUp, addTodo,  //insert 
    changePassword, changeStatus, updateTodo, updateCheckIsMonday,//update
    getAddressByText,//place
    deleteToto
};