const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

let sequelize;

if (process.env.DB_DIALECT === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'agencia',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'mysql',
      logging: false
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
}

const ensureOptionalDateColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const targets = [
    { tableName: 'Jobs', columns: ['startDate', 'endDate'] },
    { tableName: 'Courses', columns: ['startDate', 'endDate'] }
  ];

  for (const target of targets) {
    const tableDefinition = await queryInterface.describeTable(target.tableName);

    if (!tableDefinition.startDate) {
      await queryInterface.addColumn(target.tableName, 'startDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
    }

    if (!tableDefinition.endDate) {
      await queryInterface.addColumn(target.tableName, 'endDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
    }
  }
};

const ensureSettingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('Settings');
  const columns = [
    ['primaryColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['accentColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['surfaceColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['textColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['mutedColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['headingColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['backgroundBaseColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['brandKicker', { type: Sequelize.STRING, defaultValue: 'Carreira e cursos' }],
    ['brandName', { type: Sequelize.STRING, defaultValue: 'Agência de Emprego' }],
    ['footerDescription', { type: Sequelize.TEXT, defaultValue: 'Agência de Emprego conecta vagas, cursos e orientação profissional em uma experiência mais clara e confiável.' }],
    ['customCss', { type: Sequelize.TEXT, defaultValue: '' }],
    ['navbarFontSize', { type: Sequelize.INTEGER, defaultValue: 15 }],
    ['navbarItemGap', { type: Sequelize.INTEGER, defaultValue: 10 }],
    ['navbarItemPaddingX', { type: Sequelize.INTEGER, defaultValue: 16 }],
    ['navbarItemMinHeight', { type: Sequelize.INTEGER, defaultValue: 44 }],
    ['navbarWrap', { type: Sequelize.STRING, defaultValue: 'nowrap' }],
    ['heroKicker', { type: Sequelize.STRING, defaultValue: 'Plataforma profissional para carreira' }],
    ['heroTitle', { type: Sequelize.STRING, defaultValue: 'Conecte talento, contratação e qualificação em uma vitrine que transmite confiança.' }],
    ['heroDescription', { type: Sequelize.TEXT, defaultValue: 'Sua agência agora apresenta vagas e cursos em uma experiência mais forte comercialmente: clara para quem busca oportunidade e convincente para quem quer divulgar serviços e atrair candidatos qualificados.' }],
    ['heroHeight', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['heroPadding', { type: Sequelize.INTEGER, defaultValue: 42 }],
    ['heroTitleSize', { type: Sequelize.INTEGER, defaultValue: 72 }],
    ['heroContentWidth', { type: Sequelize.INTEGER, defaultValue: 720 }],
    ['heroKickerSize', { type: Sequelize.INTEGER, defaultValue: 12 }],
    ['heroDescriptionSize', { type: Sequelize.INTEGER, defaultValue: 17 }],
    ['heroTextAlign', { type: Sequelize.STRING, defaultValue: 'left' }],
    ['heroContentOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['heroContentOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['topAdsOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['topAdsOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['topAdsMaxWidth', { type: Sequelize.INTEGER, defaultValue: 1200 }],
    ['topAdsAlignment', { type: Sequelize.STRING, defaultValue: 'center' }],
    ['muralAdsOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['muralAdsOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['muralAdsMaxWidth', { type: Sequelize.INTEGER, defaultValue: 1200 }],
    ['muralAdsAlignment', { type: Sequelize.STRING, defaultValue: 'center' }],
    ['commercialPaymentLink', { type: Sequelize.STRING, defaultValue: 'https://mpago.la/2BYr2CS' }],
    ['commercialPaymentAmount', { type: Sequelize.STRING, defaultValue: 'R$ 50,00' }],
    ['commercialPaymentPlan', { type: Sequelize.STRING, defaultValue: 'Mensal' }],
    ['commercialFreeTrialMonths', { type: Sequelize.INTEGER, defaultValue: 1 }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('Settings', columnName, definition);
    }
  }
};

const ensureContactColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('ContactMessages');
  const columns = [
    ['phone', { type: Sequelize.STRING, allowNull: true }],
    ['category', { type: Sequelize.STRING, allowNull: false, defaultValue: 'contato_geral' }],
    ['subject', { type: Sequelize.STRING, allowNull: true }],
    ['preferredReply', { type: Sequelize.STRING, allowNull: false, defaultValue: 'email' }],
    ['paymentRequired', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['paymentStatus', { type: Sequelize.STRING, allowNull: false, defaultValue: 'nao_aplicavel' }],
    ['paymentMethod', { type: Sequelize.STRING, allowNull: true }],
    ['paymentLink', { type: Sequelize.STRING, allowNull: true }],
    ['paymentAmount', { type: Sequelize.STRING, allowNull: true }],
    ['paymentToken', { type: Sequelize.STRING, allowNull: true }],
    ['paymentConfirmedAt', { type: Sequelize.DATE, allowNull: true }],
    ['attachment', { type: Sequelize.STRING, allowNull: true }],
    ['attachmentOriginalName', { type: Sequelize.STRING, allowNull: true }],
    ['attachmentMimeType', { type: Sequelize.STRING, allowNull: true }],
    ['pdfAttachment', { type: Sequelize.STRING, allowNull: true }],
    ['pdfAttachmentOriginalName', { type: Sequelize.STRING, allowNull: true }],
    ['pdfAttachmentMimeType', { type: Sequelize.STRING, allowNull: true }],
    ['imageAttachment', { type: Sequelize.STRING, allowNull: true }],
    ['imageAttachmentOriginalName', { type: Sequelize.STRING, allowNull: true }],
    ['imageAttachmentMimeType', { type: Sequelize.STRING, allowNull: true }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('ContactMessages', columnName, definition);
    }
  }
};

const ensureAdvertisementColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('Advertisements');
  const columns = [
    ['placement', { type: Sequelize.STRING, allowNull: false, defaultValue: 'mural_home' }],
    ['groupName', { type: Sequelize.STRING, allowNull: false, defaultValue: 'Geral' }],
    ['position', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('Advertisements', columnName, definition);
    }
  }
};

const ensurePublicSelectionColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('PublicSelections');
  const columns = [
    ['noticePdf', { type: Sequelize.STRING, allowNull: true }],
    ['noticePdfOriginalName', { type: Sequelize.STRING, allowNull: true }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('PublicSelections', columnName, definition);
    }
  }
};

const ensureMenuColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('Menus');
  const columns = [
    ['icon', { type: Sequelize.STRING, defaultValue: 'fa-link' }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('Menus', columnName, definition);
    }
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQL Database Connected successfully!');
    await sequelize.sync();
    await ensureOptionalDateColumns();
    await ensureSettingColumns();
    await ensureContactColumns();
    await ensureAdvertisementColumns();
    await ensurePublicSelectionColumns();
    await ensureMenuColumns();
    console.log('Models synchronized.');
  } catch (err) {
    console.error('Error connecting to MySQL/SQLite:', err.message);
  }
};

module.exports = { sequelize, connectDB };
