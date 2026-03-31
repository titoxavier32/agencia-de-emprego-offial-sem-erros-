const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobApplication = sequelize.define('JobApplication', {
  jobId: { type: DataTypes.INTEGER, allowNull: false },
  candidateUserId: { type: DataTypes.INTEGER, allowNull: false },
  companyUserId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'recebida' },
  coverNote: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = JobApplication;
