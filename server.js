const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const { waitForDebugger } = require('inspector');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { use } = require('react');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'travel_agency.sqlite',
});

const Tour = sequelize.define('Tour', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false }, 
});

const Hotel = sequelize.define('Hotel', {
  name: { type: DataTypes.STRING, allowNull: false },
  stars: { type: DataTypes.INTEGER, allowNull: false }, 
  address: { type: DataTypes.STRING },
});

const City = sequelize.define('City', {
  name: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
});

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
});

const User = sequelize.define('User', {
  username: {type: DataTypes.STRING, allowNull: false, unique: true},
  password: {type: DataTypes.STRING, allowNull: false, defaultValue: 'client'},
  role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'client'},
});

User.beforeCreate(async (user) => {
  console.log('BeforeCreate hook triggered for user:', user.username);
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

Tour.belongsTo(City); 
Tour.belongsTo(Hotel); 
City.hasMany(Tour);    
Hotel.hasMany(Tour);   
Client.hasMany(Tour);  
Tour.belongsTo(Client);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'SinkSpace',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}));

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).send('Доступ запрещён');
    }
    next();
  };
};

app.get('/', async (req, res) => {
  const tours = await Tour.findAll({
    include: [City, Hotel, Client],
  });
  res.render('index', { tours, user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/add-tour', requireRole('admin'), async (req, res) => {
  try {
    const cities = await City.findAll();
    const hotels = await Hotel.findAll();
    const clients = await Client.findAll();
    res.render('add-tour', { cities, hotels, clients });
  } catch (error) {
    console.error('Error fetching cities, hotels, or clients:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add-hotel', requireRole('admin'), (req, res) => {
  res.render('add-hotel');
});

app.get('/add-city', requireRole('admin'), (req, res) => {
  res.render('add-city');
});

app.get('/add-client', requireRole('admin'), (req, res) => {
  res.render('add-client');
});

app.get('/edit-tour/:id', requireRole('admin'), async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findByPk(tourId, {
      include: [City, Hotel, Client],
    });
    const cities = await City.findAll();
    const hotels = await Hotel.findAll();
    const clients = await Client.findAll();
    res.render('edit-tour', { tour, cities, hotels, clients });
  } catch (error) {
    console.error('Error fetching tour, cities, hotels, or clients:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username && password) {
      await User.create({username, password});
      res.redirect('/');
    } else {
      res.status(400).send('Логин и пароль обязательны');
    }
  } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Internal Server Error');
    }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user.id, role: user.role };
      res.redirect('/');
    } else {
      res.status(400).send('Неверный логин или пароль');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-tour', async (req, res) => {
  try {
    const { name, description, price, duration, cityId, hotelId, clientId } = req.body;
    if (name && price && duration && cityId && hotelId) {
      await Tour.create({
        name,
        description,
        price,
        duration,
        CityId: cityId,
        HotelId: hotelId,
        ClientId: clientId || null, 
      });
      res.redirect('/');
    } else {
      res.status(400).send('All required fields must be filled');
    }
  } catch (error) {
    console.error('Error adding tour:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-hotel', async (req, res) => {
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
});

app.post('/add-city', async (req, res) => {
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
});

app.post('/add-client', async (req, res) => {
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
});

app.post('/delete-tour/:id', requireRole('admin'), async (req, res) => {
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
});

app.post('/edit-tour/:id', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const tourId = req.params.id;
    const { name, description, price, duration, cityId, hotelId, clientId } = req.body;
    await Tour.update(
      {
        name,
        description,
        price,
        duration,
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
});

(async () => {
  try {
    await sequelize.sync({ force: true }); 

    await City.bulkCreate([
      { name: 'Москва', country: 'Россия' },
      { name: 'Париж', country: 'Франция' },
    ]);

    await User.bulkCreate([
      {username: 'admin', password: 'adminpass', role: 'admin'},
      {username: 'client', password: 'clientpass', role: 'client'},
    ], {individualHooks: true});

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
