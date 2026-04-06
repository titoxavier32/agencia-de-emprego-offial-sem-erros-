const express = require('express');
const router = express.Router();
const passport = require('passport');
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const courseUpload = require('../middlewares/courseUpload');
const adUpload = require('../middlewares/adUpload');
const publicSelectionUpload = require('../middlewares/publicSelectionUpload');
const { createRedirectUploadHandler } = require('../middlewares/handleUpload');
const asyncHandler = require('../utils/asyncHandler');

const buildUploadMessage = (error, limitMessage, defaultMessage) => (
  error.code === 'LIMIT_FILE_SIZE' ? limitMessage : (error.message || defaultMessage)
);

const handleAdminImageUpload = (targetPath) => createRedirectUploadHandler(
  upload.single('image'),
  targetPath,
  (error) => buildUploadMessage(error, 'A imagem excede o limite de 50 MB.', 'Nao foi possivel processar a imagem enviada.')
);

const handleCourseImageUpload = (targetPath) => createRedirectUploadHandler(
  courseUpload.single('image'),
  targetPath,
  (error) => buildUploadMessage(error, 'A imagem excede o limite de 50 MB.', 'Nao foi possivel processar a imagem enviada.')
);

const handleAdImageUpload = (targetPath) => createRedirectUploadHandler(
  adUpload.single('image'),
  targetPath,
  (error) => buildUploadMessage(error, 'A imagem excede o limite de 50 MB.', 'Nao foi possivel processar a imagem enviada.')
);

const handlePublicSelectionUpload = (targetPath) => createRedirectUploadHandler(
  publicSelectionUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'noticePdf', maxCount: 1 }]),
  targetPath,
  (error) => buildUploadMessage(error, 'O arquivo excede o limite de 50 MB.', 'Nao foi possivel processar os arquivos enviados.')
);

const handleCompanyLogoUpload = (targetPath) => createRedirectUploadHandler(
  upload.single('companyLogo'),
  targetPath,
  (error) => buildUploadMessage(error, 'A logo excede o limite de 50 MB.', 'Nao foi possivel processar a logo enviada.')
);

router.use((req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});

router.get('/login', adminController.loginPage);
router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/admin/login?error=Dados invalidos'
}));

router.use(ensureAdmin);

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/estrutura-site', asyncHandler(adminController.siteStructure));
router.get('/candidaturas', asyncHandler(adminController.listApplications));
router.post('/candidaturas/:id/status', asyncHandler(adminController.updateApplicationStatus));
router.post('/candidaturas/:id/deletar', asyncHandler(adminController.deleteApplication));
router.get('/vagas', asyncHandler(adminController.listJobs));
router.get('/vagas/nova', asyncHandler(adminController.createJobForm));
router.post('/vagas/nova', handleAdminImageUpload('/admin/vagas/nova'), asyncHandler(adminController.createJob));
router.get('/vagas/editar/:id', asyncHandler(adminController.editJobForm));
router.post('/vagas/editar/:id', handleAdminImageUpload((req) => '/admin/vagas/editar/' + req.params.id), asyncHandler(adminController.updateJob));
router.post('/vagas/deletar/:id', asyncHandler(adminController.deleteJob));
router.get('/cursos', asyncHandler(adminController.listCourses));
router.get('/cursos/novo', asyncHandler(adminController.createCourseForm));
router.post('/cursos/novo', handleCourseImageUpload('/admin/cursos/novo'), asyncHandler(adminController.createCourse));
router.get('/cursos/editar/:id', asyncHandler(adminController.editCourseForm));
router.post('/cursos/editar/:id', handleCourseImageUpload((req) => '/admin/cursos/editar/' + req.params.id), asyncHandler(adminController.updateCourse));
router.post('/cursos/deletar/:id', asyncHandler(adminController.deleteCourse));
router.get('/selecoes-publicas', asyncHandler(adminController.listPublicSelections));
router.get('/selecoes-publicas/nova', asyncHandler(adminController.createPublicSelectionForm));
router.post('/selecoes-publicas/nova', handlePublicSelectionUpload('/admin/selecoes-publicas/nova'), asyncHandler(adminController.createPublicSelection));
router.get('/selecoes-publicas/editar/:id', asyncHandler(adminController.editPublicSelectionForm));
router.post('/selecoes-publicas/editar/:id', handlePublicSelectionUpload((req) => '/admin/selecoes-publicas/editar/' + req.params.id), asyncHandler(adminController.updatePublicSelection));
router.post('/selecoes-publicas/deletar/:id', asyncHandler(adminController.deletePublicSelection));
router.get('/propagandas', asyncHandler(adminController.listAdvertisements));
router.get('/propagandas/nova', asyncHandler(adminController.createAdvertisementForm));
router.post('/propagandas/nova', handleAdImageUpload('/admin/propagandas/nova'), asyncHandler(adminController.createAdvertisement));
router.get('/propagandas/editar/:id', asyncHandler(adminController.editAdvertisementForm));
router.post('/propagandas/editar/:id', handleAdImageUpload((req) => '/admin/propagandas/editar/' + req.params.id), asyncHandler(adminController.updateAdvertisement));
router.post('/propagandas/reposicionar/:id', asyncHandler(adminController.repositionAdvertisement));
router.post('/propagandas/deletar/:id', asyncHandler(adminController.deleteAdvertisement));
router.get('/contatos', asyncHandler(adminController.listContacts));
router.post('/contatos/:id/status', asyncHandler(adminController.updateContactStatus));
router.post('/contatos/:id/pagamento', asyncHandler(adminController.updateContactPaymentStatus));
router.post('/contatos/:id/deletar', asyncHandler(adminController.deleteContact));
router.get('/configuracoes', asyncHandler(adminController.settingsForm));
router.post('/configuracoes', upload.single('backgroundImage'), asyncHandler(adminController.updateSettings));
router.post('/configuracoes/corrigir-textos', asyncHandler(adminController.correctStoredTexts));
router.get('/usuarios', asyncHandler(adminController.listUsers));
router.post('/usuarios', asyncHandler(adminController.createUser));
router.get('/empresas', asyncHandler(adminController.listCompanies));
router.get('/empresas/editar/:id', asyncHandler(adminController.editCompanyForm));
router.post('/empresas/editar/:id', handleCompanyLogoUpload((req) => '/admin/empresas/editar/' + req.params.id), asyncHandler(adminController.updateCompany));
router.post('/empresas/:id/aprovar', asyncHandler(adminController.approveCompany));
router.post('/empresas/:id/bloquear', asyncHandler(adminController.blockCompany));
router.get('/menus', asyncHandler(adminController.listMenus));
router.get('/menus/nova', asyncHandler(adminController.menuForm));
router.post('/menus/nova', asyncHandler(adminController.createMenu));
router.get('/menus/editar/:id', asyncHandler(adminController.menuForm));
router.post('/menus/editar/:id', asyncHandler(adminController.updateMenu));
router.post('/menus/mover/:id', asyncHandler(adminController.moveMenu));
router.post('/menus/deletar/:id', asyncHandler(adminController.deleteMenu));

module.exports = router;
