const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig')
const {
    onLoginById, getUserToken, onLogout, checkExistId, checkExistNickname, sendSms, kakaoCallBack, editMyInfo, uploadProfile, onLoginBySns,//auth
    getUsers, getOneWord, getOneEvent, getItems, getItem, getHomeContent, getSetting, getVideoContent, getChannelList, getVideo, onSearchAllItem, findIdByPhone, findAuthByIdAndPhone, getMasterContents, getMainContent, getUserContent, getMasterContent,//select
    addMaster, onSignUp, addOneWord, addOneEvent, addItem, addIssueCategory, addNoteImage, addVideo, addSetting, addChannel, addFeatureCategory, addNotice, addSubscribeContent, addSubscribe, //insert 
    updateUser, updateItem, updateIssueCategory, updateVideo, updateMaster, updateSetting, updateStatus, updateChannel, updateFeatureCategory, updateNotice, onTheTopItem, changeItemSequence, changePassword, updateMasterContent, updateSubscribeContent, editMainContent,//update
    deleteItem
} = require('./api')

router.post('/editmyinfo', editMyInfo);
router.post('/uploadprofile', upload.single('profile'), uploadProfile)
router.post('/kakao/callback', kakaoCallBack);
router.post('/sendsms', sendSms);
router.post('/findidbyphone', findIdByPhone);
router.post('/findauthbyidandphone', findAuthByIdAndPhone);
router.post('/checkexistid', checkExistId);
router.post('/checkexistnickname', checkExistNickname);
router.post('/changepassword', changePassword);
router.post('/adduser', onSignUp);
router.get('/getusercontent', getUserContent);
router.post('/addsubscribe', addSubscribe);

router.post('/addmaster', upload.single('master'), addMaster);
router.post('/updatemaster', upload.single('master'), updateMaster);
router.post('/addchannel', upload.single('channel'), addChannel);
router.post('/updatechannel', upload.single('channel'), updateChannel);
router.get('/getchannel', getChannelList);
router.post('/loginbyid', onLoginById);
router.post('/loginbysns', onLoginBySns);
router.post('/logout', onLogout);
router.get('/auth', getUserToken);
router.get('/users', getUsers);
router.post('/addoneword', upload.single('content'), addOneWord);
router.post('/addoneevent', upload.single('content'), addOneEvent);
router.post('/additem', upload.single('content'), addItem);
router.post('/updateitem', upload.single('content'), updateItem);
router.post('/addvideo', addVideo);
router.post('/updatevideo', updateVideo);
router.post('/addnotice', addNotice);
router.post('/updatenotice', updateNotice);
router.post('/addissuecategory', upload.single('content'), addIssueCategory);
router.post('/updateissuecategory', upload.single('content'), updateIssueCategory);
router.post('/addfeaturecategory', upload.single('content'), addFeatureCategory);
router.post('/updatefeaturecategory', upload.single('content'), updateFeatureCategory);
router.post('/addimage', upload.single('note'), addNoteImage);
router.post('/deleteitem', deleteItem);
router.post('/updateuser', updateUser);
router.get('/onsearchallitem', onSearchAllItem);
router.get('/oneword', getOneWord);
router.get('/oneevent', getOneEvent);
router.post('/getmastercontents', getMasterContents);
router.get('/getmastercontent', getMasterContent);
router.post('/updatemastercontent', updateMasterContent);
router.post('/addsubscribecontent', upload.fields([{ name: 'major_bussiness_img' }, { name: 'capital_change_img' }, { name: 'investment_indicator_img' }]), addSubscribeContent);
router.post('/updatesubscribecontent', upload.fields([{ name: 'major_bussiness_img' }, { name: 'capital_change_img' }, { name: 'investment_indicator_img' }]), updateSubscribeContent);
router.get('/items', getItems);
router.get('/item', getItem);
router.get('/gethomecontent', getHomeContent);
router.post('/updatesetting', upload.single('master'), updateSetting);
router.post('/addsetting', upload.single('master'), addSetting);
router.post('/editmaincontent', upload.fields([{ name: 'main' }, { name: 'banner' }, { name: 'recommendation_banner' }]), editMainContent);
router.get('/getmaincontent', getMainContent);
router.get('/setting', getSetting);
router.post('/updatestatus', updateStatus);
router.get('/getvideocontent', getVideoContent);
router.get('/video/:pk', getVideo);
router.post('/onthetopitem', onTheTopItem);
router.post('/changeitemsequence', changeItemSequence);

module.exports = router;