const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Google Auth
router.get('/google', authController.googleAuth);

// Google Auth Callback
router.get('/google/callback', authController.googleCallback);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
