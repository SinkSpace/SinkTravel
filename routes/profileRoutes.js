const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/profile', requireAuth, profileController.showProfile);
router.post('/profile/update', requireAuth, profileController.updateProfile);

module.exports = router;