const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const tourRoutes = require('./tourRoutes');
const cartRoutes = require('./cartRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/', authRoutes);
router.use('/', tourRoutes);
router.use('/', cartRoutes);
router.use('/', profileRoutes);
router.use('/', adminRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Страница не найдена',
    user: req.session.user
  });
});

module.exports = router;