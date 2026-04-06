const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authController = require('../controllers/authController');
const ContactMessage = require('../models/ContactMessage');
const contactUpload = require('../middlewares/contactUpload');
const { withUploadErrorHandling } = require('../middlewares/handleUpload');
const asyncHandler = require('../utils/asyncHandler');
const mercadopagoService = require('../utils/mercadopagoService');

router.get('/', asyncHandler(siteController.home));
router.get('/vagas', asyncHandler(siteController.vagas));
router.get('/empresas-parceiras', asyncHandler(siteController.partnerCompanies));
router.get('/acesso-candidato', asyncHandler(authController.candidateAccessPage));
router.get('/politica-de-privacidade', siteController.privacyPolicy);
router.get('/termos-de-uso', siteController.termsOfUse);
router.get('/cursos', asyncHandler(siteController.cursos));
router.get('/mural-publicitario', asyncHandler(siteController.advertisements));
router.get('/selecoes-publicas', asyncHandler(siteController.publicSelections));
router.get('/selecoes-publicas/:id', asyncHandler(siteController.publicSelectionDetail));
router.get('/sobre', siteController.sobre);
router.get('/contato', asyncHandler(siteController.contato));
router.get('/contato/pagamento/:id', asyncHandler(siteController.contactPaymentStep));
router.post(
  '/contato',
  withUploadErrorHandling(
    contactUpload.fields([
      { name: 'attachmentPdf', maxCount: 1 },
      { name: 'attachmentImage', maxCount: 1 }
    ]),
    (error, req, res) => {
      req.uploadError = error.message || 'Nao foi possivel processar o anexo enviado.';
      return siteController.contactUploadError(req, res);
    }
  ),
  asyncHandler(siteController.submitContato)
);
router.post('/contato/pagamento/:id/confirmar', asyncHandler(siteController.confirmContactPayment));

router.post('/webhooks/mercadopago', asyncHandler(async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data && data.id;
      if (paymentId) {
        const paymentInfo = await mercadopagoService.getPaymentInfo(paymentId);
        if (paymentInfo && paymentInfo.external_reference) {
          const contact = await ContactMessage.findByPk(paymentInfo.external_reference);
          if (contact && paymentInfo.status === 'approved') {
            await contact.update({
              paymentStatus: 'pagamento_confirmado',
              paymentConfirmedAt: new Date()
            });
          }
        }
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook MercadoPago error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

module.exports = router;
