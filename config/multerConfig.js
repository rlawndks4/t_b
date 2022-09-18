const multer = require('multer');

const storage = multer.diskStorage({
        destination: function (req, file, cb) {
                console.log(file)
                cb(null, __dirname + `/../image/${file.fieldname}/`);
        },
        filename: function (req, file, cb) {
                cb(null, Date.now() + `-${file.fieldname}.` + file.mimetype.split('/')[1])

        }
})
const fileFilter = (req, file, cb) => {
        let typeArray = file.mimetype.split('/')
        let filetype = typeArray[1]
        if (filetype == 'jpg' || filetype == 'png' || filetype == 'gif' || filetype == 'jpeg' || filetype == 'bmp' || filetype == 'mp4' || filetype == 'avi' || filetype == 'webp' || filetype == 'ico')
                return cb(null, true)

        console.log((file.fieldname === 'image') ? '광고 ' : '상품 ' + '파일 확장자 제한: ', filetype)
        req.fileValidationError = "파일 형식이 올바르지 않습니다(.jpg, .png, .gif 만 가능)"
        cb(null, false, new Error("파일 형식이 올바르지 않습니다(.jpg, .png, .gif 만 가능)"))
}
const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limit: { fileSize:  100 * 1024 * 1024 }
});

module.exports = { upload }