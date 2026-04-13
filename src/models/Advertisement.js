const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Advertisement = sequelize.define('Advertisement', {
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  description: {
    type: DataTypes.TEXT
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.STRING
  },
  placement: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'mural_home'
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Geral'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 105
  },
  animation: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pulse'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  heroKicker: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  heroButtonLabel: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
});

module.exports = Advertisement;
