const multer = require('multer');
const path = require('path');

const uploadFile = () => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Determine the folder based on the field name
            let uploadPath = path.join('uploads', file.fieldname);
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
                cb(null, uploadPath);
            } else {
                cb(new Error('Invalid file type'));
            }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name);
        },
    });

    const fileFilter = (req, file, cb) => {
        const allowedFilenames = ['img', 'video', 'logo'];
        if (allowedFilenames.includes(file.fieldname)) {
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type'));
            }
        } else {
            cb(new Error('Invalid field name'));
        }
    };

    const maxVideoLength = 20;
    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    }).fields([
        { name: 'img', maxCount: 4 },
        { name: 'video', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
    ]);

    return (req, res, next) => {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(400).send({ success: false, message: err.message });
            }
            // Video size validation (if necessary)
            if (req?.files?.video) {
                const fileSizeMB = req.files.video[0].size / (1024 * 1024);
                if (fileSizeMB > maxVideoLength) {
                    UnlinkFiles([req.files.video[0].path]);
                    return res.status(400).send({ success: false, message: 'Max video length is 20 MB' });
                }
            }
            next();
        });
    };
};

module.exports = uploadFile;
