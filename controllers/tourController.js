const { Tour, City, Hotel, Client } = require('../models');

const tourController = {
  showHome: async (req, res) => {
    try {
      const tours = await Tour.findAll({
        include: [City, Hotel, Client],
        limit: 6
      });
      res.render('index', { 
        tours, 
        user: req.session.user,
        title: 'Главная - Туристическое агентство'
      });
    } catch (error) {
      console.error('Error fetching tours:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки туров',
        title: 'Ошибка'
      });
    }
  },

  showCatalog: async (req, res) => {
    try {
      const tours = await Tour.findAll({
        include: [City, Hotel, Client],
      });
      res.render('catalog', { 
        tours, 
        user: req.session.user,
        title: 'Каталог туров'
      });
    } catch (error) {
      console.error('Error fetching tours for catalog:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки каталога',
        title: 'Ошибка'
      });
    }
  },

  showDatabase: async (req, res) => {
    try {
      const tours = await Tour.findAll({
        include: [City, Hotel, Client],
      });
      res.render('database', { 
        tours, 
        user: req.session.user,
        title: 'База данных туров'
      });
    } catch (error) {
      console.error('Error fetching tours for database view:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки базы данных',
        title: 'Ошибка'
      });
    }
  }
};

module.exports = tourController;