const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PublicSelection = sequelize.define('PublicSelection', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'processo_seletivo',
    validate: { isIn: [['concurso_publico', 'processo_seletivo']] }
  },
  processNumber: { type: DataTypes.STRING },
  selectionType: { type: DataTypes.STRING },
  sphere: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  salary: { type: DataTypes.STRING },
  educationLevel: { type: DataTypes.STRING },
  processWebsite: { type: DataTypes.STRING },
  legalRegime: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
  isExtendable: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.STRING, defaultValue: 'Publicado' },
  organizer: { type: DataTypes.STRING },
  destinationAgency: { type: DataTypes.STRING },
  registrationLocation: { type: DataTypes.STRING },
  noticePublicationDate: { type: DataTypes.DATEONLY, allowNull: true },
  registrationStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  registrationEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  targetAudience: { type: DataTypes.TEXT },
  link: { type: DataTypes.STRING },
  image: { type: DataTypes.STRING, allowNull: true },
  noticePdf: { type: DataTypes.STRING, allowNull: true },
  noticePdfOriginalName: { type: DataTypes.STRING, allowNull: true },
  schedule: { type: DataTypes.TEXT },
  vacancies: { type: DataTypes.TEXT }
});

module.exports = PublicSelection;
