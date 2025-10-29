const sequelize = require('../config/database');
const User = require('./User');
const Tour = require('./Tour');
const City = require('./City');
const Hotel = require('./Hotel');
const Client = require('./Client');
const Cart = require('./Cart');
const CartItem = require('./CartItem');

// Определение связей
Tour.belongsTo(City);
Tour.belongsTo(Hotel);
Tour.belongsTo(Client);
City.hasMany(Tour);
Hotel.hasMany(Tour);
Client.hasMany(Tour);

User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Tour, { through: CartItem });
Tour.belongsToMany(Cart, { through: CartItem });

module.exports = {
  sequelize,
  User,
  Tour,
  City,
  Hotel,
  Client,
  Cart,
  CartItem
};