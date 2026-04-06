const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated, ensureApprovedCompany, ensureCandidate } = require('../middlewares/auth');
const profileUpload = require('../middlewares/profileUpload');
const upload = require('../middlewares/upload');
const { createRedirectUploadHandler } = require('../middlewares/handleUpload');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', ensureAuthenticated, asyncHandler(userController.perfil));
router.post(
  '/',
  ensureAuthenticated,
  createRedirectUploadHandler(
    profileUpload.fields([
      { name: 'resumePdf', maxCount: 1 },
      { name: 'companyLogo', maxCount: 1 }
    ]),
    '/perfil',
    (error) => error.message || 'Nao foi possivel enviar o arquivo.'
  ),
  asyncHandler(userController.updatePerfil)
);

router.get('/empresa/vagas', ensureApprovedCompany, asyncHandler(userController.companyJobs));
router.get('/empresa/vagas/nova', ensureApprovedCompany, asyncHandler(userController.companyJobForm));
router.post(
  '/empresa/vagas/nova',
  ensureApprovedCompany,
  createRedirectUploadHandler(
    upload.single('image'),
    '/perfil/empresa/vagas/nova',
    (error) => error.message || 'Nao foi possivel enviar a imagem da vaga.'
  ),
  asyncHandler(userController.saveCompanyJob)
);
router.get('/empresa/vagas/:id/editar', ensureApprovedCompany, asyncHandler(userController.companyJobForm));
router.post(
  '/empresa/vagas/:id/editar',
  ensureApprovedCompany,
  createRedirectUploadHandler(
    upload.single('image'),
    (req) => '/perfil/empresa/vagas/' + req.params.id + '/editar',
    (error) => error.message || 'Nao foi possivel enviar a imagem da vaga.'
  ),
  asyncHandler(userController.saveCompanyJob)
);
router.post('/empresa/vagas/:id/deletar', ensureApprovedCompany, asyncHandler(userController.deleteCompanyJob));
router.get('/empresa/vagas/:id/candidatos', ensureApprovedCompany, asyncHandler(userController.companyJobApplications));
router.post('/empresa/candidaturas/:applicationId/status', ensureApprovedCompany, asyncHandler(userController.updateApplicationStatus));
router.post('/vagas/:id/candidatar', ensureCandidate, asyncHandler(userController.applyForJob));

module.exports = router;
