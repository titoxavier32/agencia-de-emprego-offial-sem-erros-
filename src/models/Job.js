const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING },
  companyUserId: { type: DataTypes.INTEGER, allowNull: true },
  companyName: { type: DataTypes.STRING, allowNull: true },
  vacancies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  salary: { type: DataTypes.STRING, allowNull: true },
  employmentType: { type: DataTypes.STRING, allowNull: true },
  workplaceMode: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  requirements: { type: DataTypes.TEXT, allowNull: true },
  benefits: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ativa' },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true }
});

module.exports = Job;
