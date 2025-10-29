const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

router.get('/', tourController.showHome);
router.get('/catalog', tourController.showCatalog);
router.get('/database', tourController.showDatabase);

module.exports = router;