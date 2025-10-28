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

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
});

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
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

User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Tour, { through: CartItem });
Tour.belongsToMany(Cart, { through: CartItem });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'SinkSpace',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).send('Доступ запрещён');
    }
    next();
  };
};

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.get('/', async (req, res) => {
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
});

app.get('/catalog', async (req, res) => {
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
});

app.get('/cart', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { UserId: req.session.user.id },
      include: {
        model: Tour,
        through: { attributes: ['quantity'] },
        include: [City, Hotel]
      }
    });

    let total = 0;
    let items = [];
    
    if (cart && cart.Tours) {
      items = cart.Tours;
      total = items.reduce((sum, tour) => sum + (tour.price * tour.CartItem.quantity), 0);
    }

    res.render('cart', {
      items,
      total,
      user: req.session.user,
      title: 'Корзина'
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).render('error', { 
      message: 'Ошибка загрузки корзины',
      title: 'Ошибка'
    });
  }
});

app.post('/cart/add/:tourId', requireAuth, async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = req.session.user.id;

    let cart = await Cart.findOne({ where: { UserId: userId } });
    
    if (!cart) {
      cart = await Cart.create({ UserId: userId });
    }

    const cartItem = await CartItem.findOne({
      where: { CartId: cart.id, TourId: tourId }
    });

    if (cartItem) {
      await cartItem.update({ quantity: cartItem.quantity + 1 });
    } else {
      await CartItem.create({ CartId: cart.id, TourId: tourId });
    }

    res.json({ success: true, message: 'Тур добавлен в корзину' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Ошибка добавления в корзину' });
  }
});

app.post('/cart/remove/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    await CartItem.destroy({ where: { id: itemId } });
    res.json({ success: true, message: 'Тур удален из корзины' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Ошибка удаления из корзины' });
  }
});

app.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    const userTours = await Tour.findAll({
      where: { ClientId: req.session.user.id },
      include: [City, Hotel]
    });

    res.render('profile', {
      user,
      tours: userTours,
      title: 'Мой профиль'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).render('error', { 
      message: 'Ошибка загрузки профиля',
      title: 'Ошибка'
    });
  }
});

app.post('/profile/update', requireAuth, async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.session.user.id);

    let updateData = { username };

    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).render('profile', {
          user,
          error: 'Неверный текущий пароль',
          title: 'Мой профиль'
        });
      }
      updateData.password = newPassword;
    }

    await user.update(updateData);
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).render('error', { 
      message: 'Ошибка обновления профиля',
      title: 'Ошибка'
    });
  }
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { title: 'Регистрация' });
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Вход в систему' });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/add-tour', requireRole('admin'), async (req, res) => {
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
});

app.get('/add-hotel', requireRole('admin'), (req, res) => {
  res.render('add-hotel', { title: 'Добавить отель' });
});

app.get('/add-city', requireRole('admin'), (req, res) => {
  res.render('add-city', { title: 'Добавить город' });
});

app.get('/add-client', requireRole('admin'), (req, res) => {
  res.render('add-client', { title: 'Добавить клиента' });
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
    res.render('edit-tour', { tour, cities, hotels, clients, title: 'Редактировать тур' });
  } catch (error) {
    console.error('Error fetching tour, cities, hotels, or clients:', error);
    res.status(500).render('error', { 
      message: 'Ошибка загрузки формы',
      title: 'Ошибка'
    });
  }
});

app.get('/database', requireAuth, async (req, res) => {
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
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username && password) {
      await User.create({username, password});
      res.redirect('/login');
    } else {
      res.status(400).render('register', { 
        error: 'Логин и пароль обязательны',
        title: 'Регистрация'
      });
    }
  } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).render('error', { 
        message: 'Ошибка регистрации',
        title: 'Ошибка'
      });
    }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user.id, username: user.username, role: user.role };
      res.redirect('/');
    } else {
      res.status(400).render('login', { 
        error: 'Неверный логин или пароль',
        title: 'Вход в систему'
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).render('error', { 
      message: 'Ошибка входа',
      title: 'Ошибка'
    });
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

app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Страница не найдена',
    user: req.session.user
  });
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