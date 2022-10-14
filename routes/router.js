const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig')
const {
    onLoginById, getUserToken, onLogout, checkExistId, checkExistNickname, sendSms, kakaoCallBack, editMyInfo, onLoginBySns,//auth
    findIdByPhone, findAuthByIdAndPhone, getUserContent, getTodoList, getToDoListStatistics,//select
    onSignUp, addTodo,  //insert 
    changePassword, changeStatus,//update
    getAddressByText//place
} = require('./api')

router.post('/editmyinfo', editMyInfo);
router.post('/kakao/callback', kakaoCallBack);
router.post('/sendsms', sendSms);
router.post('/findidbyphone', findIdByPhone);
router.post('/findauthbyidandphone', findAuthByIdAndPhone);
router.post('/checkexistid', checkExistId);
router.post('/checkexistnickname', checkExistNickname);
router.post('/changepassword', changePassword);
router.post('/adduser', onSignUp);
router.get('/getusercontent', getUserContent);
router.post('/loginbyid', onLoginById);
router.post('/loginbysns', onLoginBySns);
router.post('/logout', onLogout);
router.get('/auth', getUserToken);
router.post('/getaddressbytext', getAddressByText);
router.post('/addtodo', addTodo);
router.post('/gettodolist', getTodoList);
router.post('/changestatus', changeStatus);
router.post('/gettodoliststatistics', getToDoListStatistics);

module.exports = router;