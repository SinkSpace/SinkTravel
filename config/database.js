const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'travel_agency.sqlite',
  logging: false
});

module.exports = sequelize;