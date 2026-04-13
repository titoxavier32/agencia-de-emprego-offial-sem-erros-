const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SatisfactionSurvey = sequelize.define('SatisfactionSurvey', {
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: { type: DataTypes.TEXT, allowNull: true },
  visitorIp: { type: DataTypes.STRING, allowNull: true },
  page: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'lido' } // 'lido' ou 'arquivado'
}, {
  timestamps: true
});

module.exports = SatisfactionSurvey;
