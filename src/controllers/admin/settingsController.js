const { Op } = require('sequelize');
const Setting = require('../../models/Setting');
const Menu = require('../../models/Menu');
const Job = require('../../models/Job');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Advertisement = require('../../models/Advertisement');
const PublicSelection = require('../../models/PublicSelection');
const { ensureDefaultMenus } = require('../../utils/menuDefaults');
const { parseAdminSidebarConfig, forceAdminSidebarVisibility, buildAdminSidebarItemsFromBody } = require('../../utils/adminSidebarDefaults');
const { clearAccessTokenCache } = require('../../utils/mercadopagoService');
const {
  buildResolvedHomeSectionOrder,
  normalizeInstanceFields,
  normalizeOptionalValue
} = require('./helpers');

exports.settingsForm = async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create({});
  }

  const menuPreviewItems = await Menu.findAll({
    where: { isActive: true },
    order: [['order', 'ASC'], ['id', 'ASC']],
    limit: 8
  });
  const adminSidebarItems = forceAdminSidebarVisibility(parseAdminSidebarConfig(setting.adminSidebarConfig));

  return res.render('admin/configuracoes', {
    title: 'Configuracoes de tema',
    s: setting,
    user: req.user,
    menuPreviewItems,
    adminSidebarItems
  });
};

exports.updateSettings = async (req, res) => {
  const { themeColor, backgroundOpacity, socialInstagram, socialFacebook, socialThreads } = req.body;
  const updateData = {
    themeColor,
    primaryColor: normalizeOptionalValue(req.body.primaryColor),
    accentColor: normalizeOptionalValue(req.body.accentColor),
    surfaceColor: normalizeOptionalValue(req.body.surfaceColor),
    textColor: normalizeOptionalValue(req.body.textColor),
    mutedColor: normalizeOptionalValue(req.body.mutedColor),
    headingColor: normalizeOptionalValue(req.body.headingColor),
    backgroundBaseColor: normalizeOptionalValue(req.body.backgroundBaseColor),
    backgroundOpacity: parseFloat(backgroundOpacity),
    socialInstagram,
    socialFacebook,
    socialThreads,
    brandKicker: normalizeOptionalValue(req.body.brandKicker) || 'Carreira e cursos',
    brandName: normalizeOptionalValue(req.body.brandName) || 'Agencia de Emprego',
    footerDescription: normalizeOptionalValue(req.body.footerDescription) || 'Agencia de Emprego conecta vagas, cursos e orientacao profissional em uma experiencia mais clara e confiavel.',
    customCss: req.body.customCss || '',
    cardImageHeight: parseInt(req.body.cardImageHeight, 10) || 200,
    navbarPosition: req.body.navbarPosition || 'top',
    navbarAlignment: req.body.navbarAlignment || 'end',
    navbarFontSize: parseInt(req.body.navbarFontSize, 10) || 15,
    navbarItemGap: parseInt(req.body.navbarItemGap, 10) || 10,
    navbarItemPaddingX: parseInt(req.body.navbarItemPaddingX, 10) || 16,
    navbarItemMinHeight: parseInt(req.body.navbarItemMinHeight, 10) || 44,
    navbarWrap: normalizeOptionalValue(req.body.navbarWrap) || 'nowrap',
    heroKicker: normalizeOptionalValue(req.body.heroKicker) || 'Plataforma profissional para carreira',
    heroTitle: normalizeOptionalValue(req.body.heroTitle) || 'Conecte talento, contratacao e qualificacao em uma vitrine que transmite confianca.',
    heroDescription: normalizeOptionalValue(req.body.heroDescription) || 'Sua agencia agora apresenta vagas e cursos em uma experiencia mais forte comercialmente: clara para quem busca oportunidade e convincente para quem quer divulgar servicos e atrair candidatos qualificados.',
    heroHeight: parseInt(req.body.heroHeight, 10) || 0,
    heroPadding: parseInt(req.body.heroPadding, 10) || 42,
    heroTitleSize: parseInt(req.body.heroTitleSize, 10) || 72,
    heroContentWidth: parseInt(req.body.heroContentWidth, 10) || 720,
    heroKickerSize: parseInt(req.body.heroKickerSize, 10) || 12,
    heroDescriptionSize: parseInt(req.body.heroDescriptionSize, 10) || 17,
    heroTextAlign: normalizeOptionalValue(req.body.heroTextAlign) || 'left',
    heroPlacement: normalizeOptionalValue(req.body.heroPlacement) || 'after_top_ads',
    heroContentOffsetX: parseInt(req.body.heroContentOffsetX, 10) || 0,
    heroContentOffsetY: parseInt(req.body.heroContentOffsetY, 10) || 0,
    heroEnabled: req.body.heroEnabled === 'on',
    heroShowKicker: req.body.heroShowKicker === 'on',
    heroShowDescription: req.body.heroShowDescription === 'on',
    heroShowActions: req.body.heroShowActions === 'on',
    heroShowStats: req.body.heroShowStats === 'on',
    heroMaxWidth: parseInt(req.body.heroMaxWidth, 10) || 0,
    heroBorderRadius: parseInt(req.body.heroBorderRadius, 10) || 28,
    heroBackgroundColor: normalizeOptionalValue(req.body.heroBackgroundColor),
    heroContentBackgroundColor: normalizeOptionalValue(req.body.heroContentBackgroundColor),
    heroTextColor: normalizeOptionalValue(req.body.heroTextColor),
    heroMutedTextColor: normalizeOptionalValue(req.body.heroMutedTextColor),
    heroActionPrimaryLabel: normalizeOptionalValue(req.body.heroActionPrimaryLabel) || 'Cadastrar curriculo',
    heroActionPrimaryLink: normalizeOptionalValue(req.body.heroActionPrimaryLink) || '/acesso-candidato?section=register-candidate',
    heroActionSecondaryLabel: normalizeOptionalValue(req.body.heroActionSecondaryLabel) || 'Explorar vagas',
    heroActionSecondaryLink: normalizeOptionalValue(req.body.heroActionSecondaryLink) || '/vagas',
    heroActionTertiaryLabel: normalizeOptionalValue(req.body.heroActionTertiaryLabel) || 'Conhecer cursos',
    heroActionTertiaryLink: normalizeOptionalValue(req.body.heroActionTertiaryLink) || '/cursos',
    heroActionQuaternaryLabel: normalizeOptionalValue(req.body.heroActionQuaternaryLabel) || 'Falar com a equipe',
    heroActionQuaternaryLink: normalizeOptionalValue(req.body.heroActionQuaternaryLink) || '/contato',
    heroStat1Value: normalizeOptionalValue(req.body.heroStat1Value),
    heroStat1Label: normalizeOptionalValue(req.body.heroStat1Label) || 'vagas com apresentacao mais objetiva',
    heroStat2Value: normalizeOptionalValue(req.body.heroStat2Value),
    heroStat2Label: normalizeOptionalValue(req.body.heroStat2Label) || 'cursos posicionados para conversao',
    heroStat3Value: normalizeOptionalValue(req.body.heroStat3Value),
    heroStat3Label: normalizeOptionalValue(req.body.heroStat3Label) || 'editais publicos com cronograma e quadro de vagas',
    topAdsOffsetX: parseInt(req.body.topAdsOffsetX, 10) || 0,
    topAdsOffsetY: parseInt(req.body.topAdsOffsetY, 10) || 0,
    topAdsMaxWidth: parseInt(req.body.topAdsMaxWidth, 10) || 1200,
    topAdsAlignment: normalizeOptionalValue(req.body.topAdsAlignment) || 'center',
    muralAdsOffsetX: parseInt(req.body.muralAdsOffsetX, 10) || 0,
    muralAdsOffsetY: parseInt(req.body.muralAdsOffsetY, 10) || 0,
    muralAdsMaxWidth: parseInt(req.body.muralAdsMaxWidth, 10) || 1200,
    muralAdsAlignment: normalizeOptionalValue(req.body.muralAdsAlignment) || 'center',
    previewDialogMaxWidth: parseInt(req.body.previewDialogMaxWidth, 10) || 1380,
    previewDialogMinHeight: parseInt(req.body.previewDialogMinHeight, 10) || 82,
    previewInfoPanelWidth: parseInt(req.body.previewInfoPanelWidth, 10) || 380,
    previewSizePreset: req.body.previewSizePreset || 'large',
    detailPdfMinHeight: parseInt(req.body.detailPdfMinHeight, 10) || 1200,
    companyShowcaseEnabled: req.body.companyShowcaseEnabled === 'on',
    companyShowcaseTitle: normalizeOptionalValue(req.body.companyShowcaseTitle) || 'Empresas que divulgam vagas na plataforma',
    companyShowcaseDescription: normalizeOptionalValue(req.body.companyShowcaseDescription) || 'Painel institucional com empresas que autorizaram a divulgacao publica de dados corporativos para fortalecer a confianca de quem busca vagas.',
    companyShowcasePlacement: normalizeOptionalValue(req.body.companyShowcasePlacement) || 'after_mural',
    companyShowcaseDirection: normalizeOptionalValue(req.body.companyShowcaseDirection) || 'left',
    companyShowcaseSpeed: parseInt(req.body.companyShowcaseSpeed, 10) || 38,
    companyShowcaseCardMinWidth: parseInt(req.body.companyShowcaseCardMinWidth, 10) || 240,
    companyShowcaseShowWebsite: req.body.companyShowcaseShowWebsite === 'on',
    companyShowcaseShowLocation: req.body.companyShowcaseShowLocation === 'on',
    companyShowcaseShowSector: req.body.companyShowcaseShowSector === 'on',
    homeSectionOrder: buildResolvedHomeSectionOrder(req.body),
    adminAccessMode: normalizeOptionalValue(req.body.adminAccessMode) || 'lock',
    floatingAdminButtonLabel: normalizeOptionalValue(req.body.floatingAdminButtonLabel) || 'Acesso admin',
    adminSidebarConfig: JSON.stringify(buildAdminSidebarItemsFromBody(req.body)),
    commercialPaymentLink: normalizeOptionalValue(req.body.commercialPaymentLink) || 'https://mpago.la/2BYr2CS',
    commercialPaymentAmount: normalizeOptionalValue(req.body.commercialPaymentAmount) || 'R$ 50,00',
    commercialPaymentPlan: normalizeOptionalValue(req.body.commercialPaymentPlan) || 'Mensal',
    commercialFreeTrialMonths: Math.max(parseInt(req.body.commercialFreeTrialMonths, 10) || 0, 0),
    smtpHost: normalizeOptionalValue(req.body.smtpHost),
    smtpPort: normalizeOptionalValue(req.body.smtpPort),
    smtpUser: normalizeOptionalValue(req.body.smtpUser),
    smtpPass: normalizeOptionalValue(req.body.smtpPass),
    smtpFrom: normalizeOptionalValue(req.body.smtpFrom),
    smtpEncryption: normalizeOptionalValue(req.body.smtpEncryption) || 'tls',
    mercadoPagoAccessToken: normalizeOptionalValue(req.body.mercadoPagoAccessToken)
  };

  if (req.file) updateData.backgroundImage = req.file.filename;

  const setting = await Setting.findOne();
  if (setting) {
    await setting.update(updateData);
  } else {
    await Setting.create(updateData);
  }

  clearAccessTokenCache();

  return res.redirect('/admin/configuracoes');
};

exports.correctStoredTexts = async (req, res) => {
  let totalUpdated = 0;

  const settings = await Setting.findAll();
  for (const setting of settings) {
    const changed = await normalizeInstanceFields(setting, ['brandKicker', 'brandName', 'footerDescription', 'heroKicker', 'heroTitle', 'heroDescription', 'companyShowcaseTitle', 'companyShowcaseDescription', 'floatingAdminButtonLabel', 'adminSidebarConfig', 'commercialPaymentPlan', 'previewSizePreset']);
    if (changed) totalUpdated += 1;
  }

  const menus = await Menu.findAll();
  for (const menu of menus) {
    const changed = await normalizeInstanceFields(menu, ['label']);
    if (changed) totalUpdated += 1;
  }

  const jobs = await Job.findAll();
  for (const job of jobs) {
    const changed = await normalizeInstanceFields(job, ['title', 'description', 'companyName', 'salary', 'employmentType', 'workplaceMode', 'location', 'requirements', 'benefits']);
    if (changed) totalUpdated += 1;
  }

  const courses = await Course.findAll();
  for (const course of courses) {
    const changed = await normalizeInstanceFields(course, ['title', 'description']);
    if (changed) totalUpdated += 1;
  }

  const publicSelections = await PublicSelection.findAll();
  for (const publicSelection of publicSelections) {
    const changed = await normalizeInstanceFields(publicSelection, ['title', 'description', 'processNumber', 'selectionType', 'legalRegime', 'duration', 'status', 'organizer', 'destinationAgency', 'registrationLocation', 'targetAudience', 'schedule', 'vacancies']);
    if (changed) totalUpdated += 1;
  }

  const advertisements = await Advertisement.findAll();
  for (const advertisement of advertisements) {
    const changed = await normalizeInstanceFields(advertisement, ['title', 'description', 'groupName']);
    if (changed) totalUpdated += 1;
  }

  const users = await User.findAll();
  for (const user of users) {
    const changed = await normalizeInstanceFields(user, ['name', 'objective', 'desiredRole', 'miniResume', 'courseHistory', 'experienceHistory', 'portalReferral', 'companyProfileType', 'companyDocumentType', 'companyLegalName', 'companyTradeName', 'companyStateRegistration', 'companySector', 'companyResponsibleName', 'companyPublicDisplayName', 'companyPublicSummary', 'companyApprovalNotes', 'city', 'state', 'address']);
    if (changed) totalUpdated += 1;
  }

  return res.redirect('/admin/configuracoes?status=' + encodeURIComponent(`Correcao automatica concluida. ${totalUpdated} registro(s) foram atualizados.`));
};

exports.listMenus = async (req, res) => {
  await ensureDefaultMenus();
  const menus = await Menu.findAll({ order: [['order', 'ASC']] });
  return res.render('admin/menus/list', { title: 'Gerenciar Menus', menus, user: req.user });
};

exports.menuForm = async (req, res) => {
  let menu = null;
  if (req.params.id) {
    menu = await Menu.findByPk(req.params.id);
  }
  return res.render('admin/menus/form', { title: menu ? 'Editar Menu' : 'Novo Menu', menu, user: req.user });
};

exports.createMenu = async (req, res) => {
  const { label, url, icon, order, isActive, target } = req.body;
  await Menu.create({
    label,
    url,
    icon: normalizeOptionalValue(icon) || 'fa-link',
    order: parseInt(order, 10) || 0,
    isActive: isActive === 'on',
    target
  });
  return res.redirect('/admin/menus');
};

exports.updateMenu = async (req, res) => {
  const { label, url, icon, order, isActive, target } = req.body;
  const menu = await Menu.findByPk(req.params.id);
  if (menu) {
    await menu.update({
      label,
      url,
      icon: normalizeOptionalValue(icon) || 'fa-link',
      order: parseInt(order, 10) || 0,
      isActive: isActive === 'on',
      target
    });
  }
  return res.redirect('/admin/menus');
};

exports.moveMenu = async (req, res) => {
  const direction = req.body.direction === 'down' ? 'down' : 'up';
  const menu = await Menu.findByPk(req.params.id);

  if (!menu) {
    return res.redirect('/admin/menus');
  }

  const sortDirection = direction === 'down' ? 'ASC' : 'DESC';
  const neighbor = await Menu.findOne({
    where: {
      order: {
        [Op[direction === 'down' ? 'gt' : 'lt']]: menu.order
      }
    },
    order: [['order', sortDirection], ['id', sortDirection]]
  });

  if (neighbor) {
    const currentOrder = menu.order;
    await menu.update({ order: neighbor.order });
    await neighbor.update({ order: currentOrder });
  } else {
    const nextOrder = direction === 'down' ? menu.order + 1 : Math.max(menu.order - 1, 0);
    await menu.update({ order: nextOrder });
  }

  return res.redirect('/admin/menus');
};

exports.deleteMenu = async (req, res) => {
  const menu = await Menu.findByPk(req.params.id);
  if (menu) await menu.destroy();
  return res.redirect('/admin/menus');
};

exports.siteStructure = async (req, res) => {
  const setting = res.locals.globalSetting;
  const menus = res.locals.menus || [];

  const summaryCards = [
    { value: '5+', label: 'Vitrines visuais', note: 'Blocos de conteudo organizados para reter publico' },
    { value: '3', label: 'Perfis de usuario', note: 'Candidatos, Empresas e Administrador' },
    { value: 'Integração', label: 'Painel & Site', note: 'Conteudo editado aqui reflete em tempo real' }
  ];

  const flowNodes = [
    { title: 'Acesso e Descoberta', description: 'Visitante chega pela home, ve propagandas, empresas em destaque e explora vagas.', tags: ['Home', 'Vagas', 'Mural'] },
    { title: 'Engajamento', description: 'O usuario decide se cadastrar como candidato ou empresa baseado na vitrine comercial.', tags: ['Cadastro', 'Login'] },
    { title: 'Conversão', description: 'O candidato aplica para vagas; a empresa divulga oportunidades e aguarda validacao.', tags: ['Candidatura', 'Pagamento'] },
    { title: 'Gerenciamento', description: 'O administrador revisa pendencias, aprova empresas e ajusta a ordem da home no painel.', tags: ['Admin', 'Aprovacao', 'Layout'] }
  ];

  const flowChart = [
    { label: 'Retencao inicial', note: 'Home visual converte', value: 85 },
    { label: 'Cadastro concluido', note: 'Funil simplificado', value: 65 },
    { label: 'Candidaturas por usuario', note: 'Media alta', value: 90 }
  ];

  const orderMapping = {
    top_ads: 'Propagandas Topo',
    hero: 'Banner Principal',
    jobs: 'Vagas Recentes',
    mural: 'Mural de Anuncios',
    company_showcase: 'Vitrine de Empresas',
    contact: 'Chamada Contato',
    courses: 'Cursos em Alta',
    public_selections: 'Selecoes Publicas'
  };

  const rawOrder = setting.homeSectionOrder ? setting.homeSectionOrder.split(',') : [];
  const homeSections = rawOrder.map((key, index) => ({
    order: index + 1,
    label: orderMapping[key] || key,
    description: `Secao configurada no banco de dados.`
  }));

  return res.render('admin/estrutura-site', {
    title: 'Estrutura do site e fluxo',
    user: req.user,
    summaryCards,
    flowNodes,
    flowChart,
    homeSections
  });
};
