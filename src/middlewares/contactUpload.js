const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads/contact-attachments');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isPdfField = file.fieldname === 'attachmentPdf';
  const allowedExtensions = isPdfField ? /\.pdf$/ : /\.(jpeg|jpg|png|gif|webp)$/;
  const allowedMimeTypes = isPdfField ? /^application\/pdf$/ : /^image\/(jpeg|jpg|png|gif|webp)$/;
  const extname = allowedExtensions.test(extension);
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error(isPdfField ? 'Apenas PDF e permitido no campo de documento.' : 'Apenas imagens sao permitidas no campo de foto.'));
};

module.exports = multer({
  storage,
  limits: { fileSize: 25000000 },
  fileFilter
});
