const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING },
  googleId: { type: DataTypes.STRING },
  avatar: { type: DataTypes.STRING },
  role: { 
    type: DataTypes.STRING, 
    defaultValue: 'user',
    validate: { isIn: [['user', 'admin']] }
  }
});

module.exports = User;
