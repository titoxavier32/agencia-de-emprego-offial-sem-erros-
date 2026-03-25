const express = require('express');
const router = express.Router();
const passport = require('passport');
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const publicSelectionUpload = require('../middlewares/publicSelectionUpload');

const handleAdminImageUpload = (targetPath) => (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();

    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'A imagem excede o limite de 50 MB.'
      : (err.message || 'Não foi possível processar a imagem enviada.');

    const resolvedPath = typeof targetPath === 'function' ? targetPath(req) : targetPath;
    return res.redirect(`${resolvedPath}?error=${encodeURIComponent(message)}`);
  });
};

const handlePublicSelectionUpload = (targetPath) => (req, res, next) => {
  publicSelectionUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'noticePdf', maxCount: 1 }
  ])(req, res, (err) => {
    if (!err) return next();

    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo excede o limite de 50 MB.'
      : (err.message || 'Não foi possível processar os arquivos enviados.');

    const resolvedPath = typeof targetPath === 'function' ? targetPath(req) : targetPath;
    return res.redirect(`${resolvedPath}?error=${encodeURIComponent(message)}`);
  });
};

router.use((req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});

router.get('/login', adminController.loginPage);
router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/admin/login?error=Dados inválidos'
}));

router.use(ensureAdmin);

router.get('/dashboard', adminController.dashboard);

router.get('/vagas', adminController.listJobs);
router.get('/vagas/nova', adminController.createJobForm);
router.post('/vagas/nova', handleAdminImageUpload('/admin/vagas/nova'), adminController.createJob);
router.get('/vagas/editar/:id', adminController.editJobForm);
router.post('/vagas/editar/:id', handleAdminImageUpload((req) => `/admin/vagas/editar/${req.params.id}`), adminController.updateJob);
router.post('/vagas/deletar/:id', adminController.deleteJob);

router.get('/cursos', adminController.listCourses);
router.get('/cursos/novo', adminController.createCourseForm);
router.post('/cursos/novo', handleAdminImageUpload('/admin/cursos/novo'), adminController.createCourse);
router.get('/cursos/editar/:id', adminController.editCourseForm);
router.post('/cursos/editar/:id', handleAdminImageUpload((req) => `/admin/cursos/editar/${req.params.id}`), adminController.updateCourse);
router.post('/cursos/deletar/:id', adminController.deleteCourse);

router.get('/selecoes-publicas', adminController.listPublicSelections);
router.get('/selecoes-publicas/nova', adminController.createPublicSelectionForm);
router.post('/selecoes-publicas/nova', handlePublicSelectionUpload('/admin/selecoes-publicas/nova'), adminController.createPublicSelection);
router.get('/selecoes-publicas/editar/:id', adminController.editPublicSelectionForm);
router.post('/selecoes-publicas/editar/:id', handlePublicSelectionUpload((req) => `/admin/selecoes-publicas/editar/${req.params.id}`), adminController.updatePublicSelection);
router.post('/selecoes-publicas/deletar/:id', adminController.deletePublicSelection);

router.get('/propagandas', adminController.listAdvertisements);
router.get('/propagandas/nova', adminController.createAdvertisementForm);
router.post('/propagandas/nova', handleAdminImageUpload('/admin/propagandas/nova'), adminController.createAdvertisement);
router.get('/propagandas/editar/:id', adminController.editAdvertisementForm);
router.post('/propagandas/editar/:id', handleAdminImageUpload((req) => `/admin/propagandas/editar/${req.params.id}`), adminController.updateAdvertisement);
router.post('/propagandas/deletar/:id', adminController.deleteAdvertisement);

router.get('/contatos', adminController.listContacts);
router.post('/contatos/:id/status', adminController.updateContactStatus);
router.post('/contatos/:id/pagamento', adminController.updateContactPaymentStatus);
router.post('/contatos/:id/deletar', adminController.deleteContact);

router.get('/configuracoes', adminController.settingsForm);
router.post('/configuracoes', upload.single('backgroundImage'), adminController.updateSettings);

router.get('/usuarios', adminController.listUsers);

router.get('/menus', adminController.listMenus);
router.get('/menus/nova', adminController.menuForm);
router.post('/menus/nova', adminController.createMenu);
router.get('/menus/editar/:id', adminController.menuForm);
router.post('/menus/editar/:id', adminController.updateMenu);
router.post('/menus/mover/:id', adminController.moveMenu);
router.post('/menus/deletar/:id', adminController.deleteMenu);

module.exports = router;


