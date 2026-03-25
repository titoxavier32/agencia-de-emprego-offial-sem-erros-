const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const contactUpload = require('../middlewares/contactUpload');

router.get('/', siteController.home);
router.get('/vagas', siteController.vagas);
router.get('/cursos', siteController.cursos);
router.get('/mural-publicitario', siteController.advertisements);
router.get('/selecoes-publicas', siteController.publicSelections);
router.get('/selecoes-publicas/:id', siteController.publicSelectionDetail);
router.get('/sobre', siteController.sobre);
router.get('/contato', siteController.contato);
router.get('/contato/pagamento/:id', siteController.contactPaymentStep);
router.post('/contato', (req, res, next) => {
  contactUpload.fields([
    { name: 'attachmentPdf', maxCount: 1 },
    { name: 'attachmentImage', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      req.uploadError = err.message || 'Não foi possível processar o anexo enviado.';
      return siteController.contactUploadError(req, res);
    }
    next();
  });
}, siteController.submitContato);
router.post('/contato/pagamento/:id/confirmar', siteController.confirmContactPayment);

module.exports = router;
