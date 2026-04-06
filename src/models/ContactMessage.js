const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'contato_geral'
  },
  subject: {
    type: DataTypes.STRING
  },
  preferredReply: {
    type: DataTypes.STRING,
    defaultValue: 'email'
  },
  paymentRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'nao_aplicavel'
  },
  paymentMethod: {
    type: DataTypes.STRING
  },
  paymentLink: {
    type: DataTypes.STRING
  },
  paymentAmount: {
    type: DataTypes.STRING
  },
  paymentToken: {
    type: DataTypes.STRING
  },
  paymentConfirmedAt: {
    type: DataTypes.DATE
  },
  pdfAttachment: {
    type: DataTypes.STRING
  },
  pdfAttachmentOriginalName: {
    type: DataTypes.STRING
  },
  pdfAttachmentMimeType: {
    type: DataTypes.STRING
  },
  imageAttachment: {
    type: DataTypes.STRING
  },
  imageAttachmentOriginalName: {
    type: DataTypes.STRING
  },
  imageAttachmentMimeType: {
    type: DataTypes.STRING
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'novo'
  }
});

module.exports = ContactMessage;
