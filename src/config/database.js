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
  const jobDefinition = await queryInterface.describeTable('Jobs');
  const jobColumns = [
    ['startDate', { type: Sequelize.DATEONLY, allowNull: true }],
    ['endDate', { type: Sequelize.DATEONLY, allowNull: true }],
    ['companyUserId', { type: Sequelize.INTEGER, allowNull: true }],
    ['companyName', { type: Sequelize.STRING, allowNull: true }],
    ['vacancies', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }],
    ['salary', { type: Sequelize.STRING, allowNull: true }],
    ['employmentType', { type: Sequelize.STRING, allowNull: true }],
    ['workplaceMode', { type: Sequelize.STRING, allowNull: true }],
    ['location', { type: Sequelize.STRING, allowNull: true }],
    ['requirements', { type: Sequelize.TEXT, allowNull: true }],
    ['benefits', { type: Sequelize.TEXT, allowNull: true }],
    ['status', { type: Sequelize.STRING, allowNull: false, defaultValue: 'ativa' }]
  ];

  for (const [columnName, definition] of jobColumns) {
    if (!jobDefinition[columnName]) {
      await queryInterface.addColumn('Jobs', columnName, definition);
    }
  }

  const courseDefinition = await queryInterface.describeTable('Courses');
  if (!courseDefinition.startDate) {
    await queryInterface.addColumn('Courses', 'startDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }

  if (!courseDefinition.endDate) {
    await queryInterface.addColumn('Courses', 'endDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
};

const ensureJobApplicationColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('JobApplications').catch(() => null);

  if (!tableDefinition) {
    await queryInterface.createTable('JobApplications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      jobId: { type: Sequelize.INTEGER, allowNull: false },
      candidateUserId: { type: Sequelize.INTEGER, allowNull: false },
      companyUserId: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'recebida' },
      coverNote: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
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
    ['heroPlacement', { type: Sequelize.STRING, defaultValue: 'after_top_ads' }],
    ['heroContentOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['heroContentOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['heroEnabled', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['heroShowKicker', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['heroShowDescription', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['heroShowActions', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['heroShowStats', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['heroMaxWidth', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['heroBorderRadius', { type: Sequelize.INTEGER, defaultValue: 28 }],
    ['heroBackgroundColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroContentBackgroundColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroTextColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroMutedTextColor', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroActionPrimaryLabel', { type: Sequelize.STRING, defaultValue: 'Cadastrar currículo' }],
    ['heroActionPrimaryLink', { type: Sequelize.STRING, defaultValue: '/acesso-candidato?section=register-candidate' }],
    ['heroActionSecondaryLabel', { type: Sequelize.STRING, defaultValue: 'Explorar vagas' }],
    ['heroActionSecondaryLink', { type: Sequelize.STRING, defaultValue: '/vagas' }],
    ['heroActionTertiaryLabel', { type: Sequelize.STRING, defaultValue: 'Conhecer cursos' }],
    ['heroActionTertiaryLink', { type: Sequelize.STRING, defaultValue: '/cursos' }],
    ['heroActionQuaternaryLabel', { type: Sequelize.STRING, defaultValue: 'Falar com a equipe' }],
    ['heroActionQuaternaryLink', { type: Sequelize.STRING, defaultValue: '/contato' }],
    ['heroStat1Value', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroStat1Label', { type: Sequelize.STRING, defaultValue: 'vagas com apresentação mais objetiva' }],
    ['heroStat2Value', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroStat2Label', { type: Sequelize.STRING, defaultValue: 'cursos posicionados para conversão' }],
    ['heroStat3Value', { type: Sequelize.STRING, defaultValue: '' }],
    ['heroStat3Label', { type: Sequelize.STRING, defaultValue: 'editais públicos com cronograma e quadro de vagas' }],
    ['topAdsOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['topAdsOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['topAdsMaxWidth', { type: Sequelize.INTEGER, defaultValue: 1200 }],
    ['topAdsAlignment', { type: Sequelize.STRING, defaultValue: 'center' }],
    ['muralAdsOffsetX', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['muralAdsOffsetY', { type: Sequelize.INTEGER, defaultValue: 0 }],
    ['muralAdsMaxWidth', { type: Sequelize.INTEGER, defaultValue: 1200 }],
    ['muralAdsAlignment', { type: Sequelize.STRING, defaultValue: 'center' }],
    ['previewDialogMaxWidth', { type: Sequelize.INTEGER, defaultValue: 1380 }],
    ['previewDialogMinHeight', { type: Sequelize.INTEGER, defaultValue: 82 }],
    ['previewInfoPanelWidth', { type: Sequelize.INTEGER, defaultValue: 380 }],
    ['detailPdfMinHeight', { type: Sequelize.INTEGER, defaultValue: 1200 }],
    ['adminAccessMode', { type: Sequelize.STRING, defaultValue: 'lock' }],
    ['floatingAdminButtonLabel', { type: Sequelize.STRING, defaultValue: 'Acesso admin' }],
    ['adminSidebarConfig', { type: Sequelize.TEXT, defaultValue: '' }],
    ['companyShowcaseEnabled', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['companyShowcaseTitle', { type: Sequelize.STRING, defaultValue: 'Empresas que divulgam vagas na plataforma' }],
    ['companyShowcaseDescription', { type: Sequelize.TEXT, defaultValue: 'Painel institucional com empresas que autorizaram a divulgacao publica de dados corporativos para fortalecer a confianca de quem busca vagas.' }],
    ['companyShowcasePlacement', { type: Sequelize.STRING, defaultValue: 'after_mural' }],
    ['companyShowcaseDirection', { type: Sequelize.STRING, defaultValue: 'left' }],
    ['companyShowcaseSpeed', { type: Sequelize.INTEGER, defaultValue: 38 }],
    ['companyShowcaseCardMinWidth', { type: Sequelize.INTEGER, defaultValue: 240 }],
    ['companyShowcaseShowWebsite', { type: Sequelize.BOOLEAN, defaultValue: false }],
    ['companyShowcaseShowLocation', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['companyShowcaseShowSector', { type: Sequelize.BOOLEAN, defaultValue: true }],
    ['homeSectionOrder', { type: Sequelize.TEXT, defaultValue: 'top_ads,hero,jobs,mural,company_showcase,contact,courses,public_selections' }],
    ['commercialPaymentLink', { type: Sequelize.STRING, defaultValue: 'https://mpago.la/2BYr2CS' }],
    ['commercialPaymentAmount', { type: Sequelize.STRING, defaultValue: 'R$ 50,00' }],
    ['commercialPaymentPlan', { type: Sequelize.STRING, defaultValue: 'Mensal' }],
    ['commercialFreeTrialMonths', { type: Sequelize.INTEGER, defaultValue: 1 }],
    ['smtpHost', { type: Sequelize.STRING, defaultValue: '' }],
    ['smtpPort', { type: Sequelize.STRING, defaultValue: '' }],
    ['smtpUser', { type: Sequelize.STRING, defaultValue: '' }],
    ['smtpPass', { type: Sequelize.STRING, defaultValue: '' }],
    ['smtpFrom', { type: Sequelize.STRING, defaultValue: '' }],
    ['smtpEncryption', { type: Sequelize.STRING, defaultValue: 'tls' }],
    ['navbarPosition', { type: Sequelize.STRING, defaultValue: 'top' }],
    ['previewSizePreset', { type: Sequelize.STRING, defaultValue: 'large' }],
    ['mercadoPagoAccessToken', { type: Sequelize.STRING, defaultValue: '' }]
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

const ensureUserColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('Users');
  const columns = [
    ['cpf', { type: Sequelize.STRING, allowNull: true }],
    ['phone', { type: Sequelize.STRING, allowNull: true }],
    ['whatsapp', { type: Sequelize.STRING, allowNull: true }],
    ['address', { type: Sequelize.STRING, allowNull: true }],
    ['city', { type: Sequelize.STRING, allowNull: true }],
    ['state', { type: Sequelize.STRING, allowNull: true }],
    ['objective', { type: Sequelize.TEXT, allowNull: true }],
    ['desiredRole', { type: Sequelize.STRING, allowNull: true }],
    ['salaryExpectation', { type: Sequelize.STRING, allowNull: true }],
    ['linkedinUrl', { type: Sequelize.STRING, allowNull: true }],
    ['resumePdf', { type: Sequelize.STRING, allowNull: true }],
    ['providerLogin', { type: Sequelize.STRING, allowNull: false, defaultValue: 'email' }],
    ['status', { type: Sequelize.STRING, allowNull: false, defaultValue: 'ativo' }],
    ['sex', { type: Sequelize.STRING, allowNull: true }],
    ['maritalStatus', { type: Sequelize.STRING, allowNull: true }],
    ['birthDate', { type: Sequelize.DATEONLY, allowNull: true }],
    ['currentlyEmployed', { type: Sequelize.STRING, allowNull: true }],
    ['disability', { type: Sequelize.STRING, allowNull: true }],
    ['hasDriverLicense', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['driverLicenseCategory', { type: Sequelize.STRING, allowNull: true }],
    ['homePhone', { type: Sequelize.STRING, allowNull: true }],
    ['commercialPhone', { type: Sequelize.STRING, allowNull: true }],
    ['commercialPhoneExtension', { type: Sequelize.STRING, allowNull: true }],
    ['mobilePhone', { type: Sequelize.STRING, allowNull: true }],
    ['personalWebsite', { type: Sequelize.STRING, allowNull: true }],
    ['addressNumber', { type: Sequelize.STRING, allowNull: true }],
    ['addressComplement', { type: Sequelize.STRING, allowNull: true }],
    ['neighborhood', { type: Sequelize.STRING, allowNull: true }],
    ['zipCode', { type: Sequelize.STRING, allowNull: true }],
    ['country', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Brasil' }],
    ['desiredWorkCities', { type: Sequelize.STRING, allowNull: true }],
    ['intendedArea', { type: Sequelize.STRING, allowNull: true }],
    ['hierarchyLevel', { type: Sequelize.STRING, allowNull: true }],
    ['englishLevel', { type: Sequelize.STRING, allowNull: true }],
    ['spanishLevel', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage1Name', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage1Level', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage2Name', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage2Level', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage3Name', { type: Sequelize.STRING, allowNull: true }],
    ['otherLanguage3Level', { type: Sequelize.STRING, allowNull: true }],
    ['miniResume', { type: Sequelize.TEXT, allowNull: true }],
    ['courseHistory', { type: Sequelize.TEXT, allowNull: true }],
    ['experienceHistory', { type: Sequelize.TEXT, allowNull: true }],
    ['portalReferral', { type: Sequelize.STRING, allowNull: true }],
    ['companyProfileType', { type: Sequelize.STRING, allowNull: true }],
    ['companyDocumentType', { type: Sequelize.STRING, allowNull: true }],
    ['companyDocument', { type: Sequelize.STRING, allowNull: true }],
    ['companyLegalName', { type: Sequelize.STRING, allowNull: true }],
    ['companyTradeName', { type: Sequelize.STRING, allowNull: true }],
    ['companyStateRegistration', { type: Sequelize.STRING, allowNull: true }],
    ['companySector', { type: Sequelize.STRING, allowNull: true }],
    ['companyResponsibleName', { type: Sequelize.STRING, allowNull: true }],
    ['companyResponsibleCpf', { type: Sequelize.STRING, allowNull: true }],
    ['companyPhone', { type: Sequelize.STRING, allowNull: true }],
    ['companyCorporateEmail', { type: Sequelize.STRING, allowNull: true }],
    ['companyZipCode', { type: Sequelize.STRING, allowNull: true }],
    ['companyWebsite', { type: Sequelize.STRING, allowNull: true }],
    ['companyPrivacyAccepted', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['companyPrivacyAcceptedAt', { type: Sequelize.DATE, allowNull: true }],
    ['companyTermsAccepted', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['companyTermsAcceptedAt', { type: Sequelize.DATE, allowNull: true }],
    ['companyShowcaseEnabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['companyShowcaseLgpdConsent', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['companyPublicDisplayName', { type: Sequelize.STRING, allowNull: true }],
    ['companyPublicSummary', { type: Sequelize.TEXT, allowNull: true }],
    ['companyShowcaseOrder', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }],
    ['companyPaymentValidated', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
    ['companyPaymentValidatedAt', { type: Sequelize.DATE, allowNull: true }],
    ['companyApprovedAt', { type: Sequelize.DATE, allowNull: true }],
    ['companyApprovedBy', { type: Sequelize.INTEGER, allowNull: true }],
    ['companyApprovalNotes', { type: Sequelize.TEXT, allowNull: true }],
    ['passwordResetTokenHash', { type: Sequelize.STRING, allowNull: true }],
    ['passwordResetCodeHash', { type: Sequelize.STRING, allowNull: true }],
    ['passwordResetExpiresAt', { type: Sequelize.DATE, allowNull: true }],
    ['passwordResetAttemptCount', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }],
    ['passwordResetLastSentAt', { type: Sequelize.DATE, allowNull: true }],
    ['passwordResetVerifiedAt', { type: Sequelize.DATE, allowNull: true }]
  ];

  for (const [columnName, definition] of columns) {
    if (!tableDefinition[columnName]) {
      await queryInterface.addColumn('Users', columnName, definition);
    }
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQL Database Connected successfully!');
    await sequelize.sync();
    await ensureOptionalDateColumns();
    await ensureJobApplicationColumns();
    await ensureSettingColumns();
    await ensureContactColumns();
    await ensureAdvertisementColumns();
    await ensurePublicSelectionColumns();
    await ensureMenuColumns();
    await ensureUserColumns();
    console.log('Models synchronized.');
  } catch (err) {
    console.error('Error connecting to MySQL/SQLite:', err.message);
  }
};

module.exports = { sequelize, connectDB };

