const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/cart', requireAuth, cartController.showCart);
router.post('/cart/add/:tourId', requireAuth, cartController.addToCart);
router.post('/cart/remove/:itemId', requireAuth, cartController.removeFromCart);

module.exports = router;