const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/', ensureAuthenticated, userController.perfil);

module.exports = router;
