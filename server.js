const express = require('express');
const path = require('path');
const session = require('express-session');
const { sequelize, User, City, Hotel, Client, Tour } = require('./models');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'SinkSpace',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Custom middleware
const { setUserLocals } = require('./middleware/authMiddleware');
app.use(setUserLocals);

// Routes
app.use(require('./routes'));

// Database initialization and server start
(async () => {
  try {
    await sequelize.sync({ force: true });

    // Seed data
    await City.bulkCreate([
      { name: 'Москва', country: 'Россия' },
      { name: 'Париж', country: 'Франция' },
    ]);

    await User.bulkCreate([
      { username: 'admin', password: 'adminpass', role: 'admin' },
      { username: 'client', password: 'clientpass', role: 'client' },
    ], { individualHooks: true });

    await Hotel.bulkCreate([
      { name: 'Отель Москва', stars: 5, address: 'ул. Тверская, 1' },
      { name: 'Отель Париж', stars: 4, address: 'ул. Елисейские поля, 10' },
    ]);

    await Client.bulkCreate([
      { name: 'Иван Иванов', email: 'ivan@example.com', phone: '+79991234567' },
      { name: 'Мария Петрова', email: 'maria@example.com', phone: '+79997654321' },
    ]);

    await Tour.bulkCreate([
      {
        name: 'Экскурсия по Москве',
        description: 'Обзорная экскурсия по главным достопримечательностям Москвы.',
        price: 15000.0,
        duration: 3,
        CityId: 1,
        HotelId: 1,
        ClientId: 1,
      },
      {
        name: 'Романтический Париж',
        description: 'Тур для влюблённых по самому романтичному городу мира.',
        price: 45000.0,
        duration: 7,
        CityId: 2,
        HotelId: 2,
        ClientId: 2,
      },
    ]);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing database:', error);
  }
})();