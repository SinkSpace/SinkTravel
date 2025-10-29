const { Tour, City, Hotel, Client } = require('../models');

const adminController = {
  showAddTour: async (req, res) => {
    try {
      const cities = await City.findAll();
      const hotels = await Hotel.findAll();
      const clients = await Client.findAll();
      res.render('add-tour', { cities, hotels, clients, title: 'Добавить тур' });
    } catch (error) {
      console.error('Error fetching cities, hotels, or clients:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки формы',
        title: 'Ошибка'
      });
    }
  },

  showAddHotel: (req, res) => {
    res.render('add-hotel', { title: 'Добавить отель' });
  },

  showAddCity: (req, res) => {
    res.render('add-city', { title: 'Добавить город' });
  },

  showAddClient: (req, res) => {
    res.render('add-client', { title: 'Добавить клиента' });
  },

  showEditTour: async (req, res) => {
    try {
      const tourId = req.params.id;
      const tour = await Tour.findByPk(tourId, {
        include: [City, Hotel, Client],
      });
      const cities = await City.findAll();
      const hotels = await Hotel.findAll();
      const clients = await Client.findAll();
      res.render('edit-tour', { tour, cities, hotels, clients, title: 'Редактировать тур' });
    } catch (error) {
      console.error('Error fetching tour, cities, hotels, or clients:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки формы',
        title: 'Ошибка'
      });
    }
  },

  addTour: async (req, res) => {
    try {
      const { name, description, price, duration, cityId, hotelId, clientId } = req.body;
      if (name && price && duration && cityId && hotelId) {
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        await Tour.create({
          name,
          description,
          price,
          duration,
          image,
          CityId: cityId,
          HotelId: hotelId,
          ClientId: clientId || null,
        });
        res.redirect('/');
      } else {
        res.status(400).send('Все обязательные поля должны быть заполнены');
      }
    } catch (error) {
      console.error('Error adding tour:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  addHotel: async (req, res) => {
    try {
      const { name, stars, address } = req.body;
      if (name && stars) {
        await Hotel.create({ name, stars, address });
        res.redirect('/');
      } else {
        res.status(400).send('Hotel name and stars are required');
      }
    } catch (error) {
      console.error('Error adding hotel:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  addCity: async (req, res) => {
    try {
      const { name, country } = req.body;
      if (name && country) {
        await City.create({ name, country });
        res.redirect('/');
      } else {
        res.status(400).send('City name and country are required');
      }
    } catch (error) {
      console.error('Error adding city:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  addClient: async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      if (name && email) {
        await Client.create({ name, email, phone });
        res.redirect('/');
      } else {
        res.status(400).send('Client name and email are required');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  deleteTour: async (req, res) => {
    try {
      const tourId = req.params.id;
      await Tour.destroy({
        where: { id: tourId },
      });
      res.redirect('/');
    } catch (error) {
      console.error('Error deleting tour:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  updateTour: async (req, res) => {
    try {
      const tourId = req.params.id;
      const { name, description, price, duration, cityId, hotelId, clientId } = req.body;

      let image = req.body.currentImage;
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }

      await Tour.update(
        {
          name,
          description,
          price,
          duration,
          image,
          CityId: cityId,
          HotelId: hotelId,
          ClientId: clientId || null,
        },
        { where: { id: tourId } }
      );
      res.redirect('/');
    } catch (error) {
      console.error('Error updating tour:', error);
      res.status(500).send('Internal Server Error');
    }
  }
};

module.exports = adminController;