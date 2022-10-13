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

const geolocation = require('geolocation')
const kakaoOpt = {
    clientId: '4a8d167fa07331905094e19aafb2dc47',
    redirectUri: 'http://172.30.1.19:8001/api/kakao/callback',
};
router.get('/', (req, res) => {
    console.log("back-end initialized")
    res.send('back-end initialized')
});




const onSignUp = async (req, res) => {
    try {
        console.log(req.body)
        //logRequest(req)
        const id = req.body.id ?? "";
        const pw = req.body.pw ?? "";
        const email = req.body.email ?? "";
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

                    sql = 'INSERT INTO user_table (id, pw, email, user_level) VALUES (?, ?, ?, ?)'
                    await db.query(sql, [id, hash, email, user_level], async (err, result) => {

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
        console.log(req.body)
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
        console.log(req.body)
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
                        email: result[0].email
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
        let { pw, nickname, newPw, phone, id } = req.body;
        crypto.pbkdf2(pw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
            // bcrypt.hash(pw, salt, async (err, hash) => {
            let hash = decoded.toString('base64')

            if (err) {
                console.log(err)
                response(req, res, -200, "비밀번호 암호화 도중 에러 발생", [])
            }

            await db.query("SELECT * FROM user_table WHERE id=? AND pw=?", [id, hash], async (err, result) => {
                if (err) {
                    console.log(err);
                    response(req, res, -100, "서버 에러 발생", [])
                } else {
                    if (result.length > 0) {
                        if (newPw) {
                            await crypto.pbkdf2(newPw, salt, saltRounds, pwBytes, 'sha512', async (err, decoded) => {
                                // bcrypt.hash(pw, salt, async (err, hash) => {
                                let new_hash = decoded.toString('base64')
                                if (err) {
                                    console.log(err)
                                    response(req, res, -200, "새 비밀번호 암호화 도중 에러 발생", [])
                                }
                                await db.query("UPDATE user_table SET pw=? WHERE id=?", [new_hash, id], (err, result) => {
                                    if (err) {
                                        console.log(err)
                                        return response(req, res, -100, "서버 에러 발생", []);
                                    } else {
                                        return response(req, res, 100, "success", []);
                                    }
                                })
                            })
                        } else if (nickname || phone) {
                            let selectSql = "";
                            let updateSql = "";
                            let zColumn = [];
                            if (nickname) {
                                selectSql = "SELECT * FROM user_table WHERE nickname=? AND id!=?"
                                updateSql = "UPDATE user_table SET nickname=? WHERE id=?";
                                zColumn.push(nickname);
                            } else if (phone) {
                                selectSql = "SELECT * FROM user_table WHERE phone=? AND id!=?"
                                updateSql = "UPDATE user_table SET phone=? WHERE id=?";
                                zColumn.push(phone);
                            }
                            zColumn.push(id);
                            await db.query(selectSql, zColumn, async (err, result1) => {
                                if (err) {
                                    console.log(err)
                                    return response(req, res, -100, "서버 에러 발생", []);
                                } else {
                                    if (result1.length > 0) {
                                        let message = "";
                                        if (nickname) {
                                            message = "이미 사용중인 닉네임 입니다.";
                                        } else if (phone) {
                                            message = "이미 사용중인 전화번호 입니다.";
                                        }
                                        return response(req, res, -50, message, []);
                                    } else {
                                        await db.query(updateSql, zColumn, (err, result2) => {
                                            if (err) {
                                                console.log(err)
                                                return response(req, res, -100, "서버 에러 발생", []);
                                            } else {
                                                return response(req, res, 100, "success", []);
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    } else {
                        response(req, res, -50, "비밀번호가 일치하지 않습니다.", [])
                    }
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
const findAuthByIdAndPhone = (req, res) => {
    try {
        const id = req.body.id;
        const phone = req.body.phone;
        db.query("SELECT * FROM user_table WHERE id=? AND phone=?", [id, phone], (err, result) => {
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

const getTodoList = (req, res) => {
    try {
        let { date, user_pk } = req.body;
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const toDoListStatistics = (req, res) => {
    try {
        let { date, type } = req.body;

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
module.exports = {
    onLoginById, getUserToken, onLogout, checkExistId, checkExistNickname, sendSms, kakaoCallBack, editMyInfo, onLoginBySns,//auth
    findIdByPhone, findAuthByIdAndPhone, getUserContent, //select
    onSignUp,  //insert 
    changePassword,//update
};