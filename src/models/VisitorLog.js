const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VisitorLog = sequelize.define('VisitorLog', {
  path: { type: DataTypes.STRING, allowNull: false },
  ip: { type: DataTypes.STRING, allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  method: { type: DataTypes.STRING, defaultValue: 'GET' },
  referrer: { type: DataTypes.TEXT, allowNull: true }
}, {
  timestamps: true,
  updatedAt: false // Somente data de criação (visita)
});

module.exports = VisitorLog;
