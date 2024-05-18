const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('newdb', 'postgres', 'postgres12', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = {sequelize}
