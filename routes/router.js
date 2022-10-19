const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig')
const {
    onLoginById, getUserToken, onLogout, checkExistId, checkExistNickname, checkPw, sendSms, kakaoCallBack, editMyInfo, onLoginBySns,//auth
    findIdByPhone, findAuthByNameAndEmail, findPwByNameAndId, getUserContent, getTodoList, getToDoListStatistics, getMyInfo,//select
    onSignUp, addTodo,  //insert 
    changePassword, changeStatus, updateTodo, updateCheckIsMonday,//update
    getAddressByText,//place
    deleteToto
} = require('./api')

router.post('/editmyinfo', editMyInfo);
router.post('/getmyinfo', getMyInfo);
router.post('/updatecheckismonday', updateCheckIsMonday);
router.post('/kakao/callback', kakaoCallBack);
router.post('/sendsms', sendSms);
router.post('/findidbyphone', findIdByPhone);
router.post('/findauthbynameandemail', findAuthByNameAndEmail);
router.post('/findpwbynameandid', findPwByNameAndId);
router.post('/checkexistid', checkExistId);
router.post('/checkexistnickname', checkExistNickname);
router.post('/checkpw', checkPw);
router.post('/changepassword', changePassword);
router.post('/adduser', onSignUp);
router.get('/getusercontent', getUserContent);
router.post('/loginbyid', onLoginById);
router.post('/loginbysns', onLoginBySns);
router.post('/logout', onLogout);
router.get('/auth', getUserToken);
router.post('/getaddressbytext', getAddressByText);
router.post('/addtodo', addTodo);
router.post('/updatetodo', updateTodo);
router.post('/gettodolist', getTodoList);
router.post('/changestatus', changeStatus);
router.post('/gettodoliststatistics', getToDoListStatistics);
router.delete('/deletetodo/:pk', deleteToto);

module.exports = router;