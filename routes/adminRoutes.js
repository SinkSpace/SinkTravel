const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/uploadMiddleware');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/add-tour', requireRole('admin'), adminController.showAddTour);
router.get('/add-hotel', requireRole('admin'), adminController.showAddHotel);
router.get('/add-city', requireRole('admin'), adminController.showAddCity);
router.get('/add-client', requireRole('admin'), adminController.showAddClient);
router.get('/edit-tour/:id', requireRole('admin'), adminController.showEditTour);

router.post('/add-tour', requireRole('admin'), upload.single('image'), adminController.addTour);
router.post('/add-hotel', requireRole('admin'), adminController.addHotel);
router.post('/add-city', requireRole('admin'), adminController.addCity);
router.post('/add-client', requireRole('admin'), adminController.addClient);
router.post('/delete-tour/:id', requireRole('admin'), adminController.deleteTour);
router.post('/edit-tour/:id', requireRole('admin'), upload.single('image'), adminController.updateTour);

module.exports = router;