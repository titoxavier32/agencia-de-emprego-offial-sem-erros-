const multer = require('multer');
const path = require('path');
const fs = require('fs');

const candidateDir = path.join(__dirname, '../public/uploads/candidates');
const companyDir = path.join(__dirname, '../public/uploads/companies');

[candidateDir, companyDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (file.fieldname === 'companyLogo') return cb(null, companyDir);
    return cb(null, candidateDir);
  },
  filename: function(req, file, cb) {
    const prefix = file.fieldname === 'companyLogo' ? 'company-logo' : 'resume';
    cb(null, prefix + '-' + Date.now() + path.extname(file.originalname));
  }
});

const imageTypes = /jpeg|jpg|png|gif|webp/;

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resumePdf') {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf' && file.mimetype === 'application/pdf';
    if (isPdf) return cb(null, true);
    return cb(new Error('Apenas curriculo em PDF e permitido.'));
  }

  if (file.fieldname === 'companyLogo') {
    const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = imageTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    return cb(new Error('A logo da empresa deve ser uma imagem valida.'));
  }

  return cb(new Error('Arquivo nao suportado.'));
};

module.exports = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});
