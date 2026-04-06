const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/logout', authController.logout);
router.get('/check-document', asyncHandler(authController.checkDocumentAvailability));
router.post('/candidate-register', asyncHandler(authController.candidateRegister));
router.post('/company-register', asyncHandler(authController.companyRegister));
router.post('/candidate-login', asyncHandler(authController.candidateLogin));
router.post('/password-reset/request', asyncHandler(authController.requestPasswordReset));
router.post('/password-reset/verify', asyncHandler(authController.verifyPasswordResetCode));
router.post('/password-reset/reset', asyncHandler(authController.resetPassword));
router.post('/admin-login', asyncHandler(authController.adminModalLogin));

module.exports = router;
