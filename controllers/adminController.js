const Job = require('../models/Job');
const Course = require('../models/Course');
const { Op } = require('sequelize');
const Setting = require('../models/Setting');
const Menu = require('../models/Menu');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const PublicSelection = require('../models/PublicSelection');
const Advertisement = require('../models/Advertisement');
const { ensureDefaultMenus } = require('../utils/menuDefaults');

const normalizeOptionalValue = (value) => value ? value.trim() : '';
const parseCurrencyToNumber = (value) => {
  if (!value) return 0;
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrencyBRL = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value || 0);

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const normalizeScheduleItems = (body) => {
  const labels = ensureArray(body.scheduleLabel);
  const dates = ensureArray(body.scheduleDate);

  return labels
    .map((label, index) => ({
      label: normalizeOptionalValue(label),
      date: normalizeOptionalValue(dates[index])
    }))
    .filter((item) => item.label || item.date);
};

const normalizeVacancyItems = (body) => {
  const fields = {
    role: ensureArray(body.vacancyRole),
    total: ensureArray(body.vacancyTotal),
    pcd: ensureArray(body.vacancyPcd),
    race: ensureArray(body.vacancyRace),
    income: ensureArray(body.vacancyIncome),
    workload: ensureArray(body.vacancyWorkload),
    salary: ensureArray(body.vacancySalary),
    zone: ensureArray(body.vacancyZone),
    workplace: ensureArray(body.vacancyWorkplace)
  };

  return fields.role
    .map((role, index) => ({
      role: normalizeOptionalValue(role),
      total: normalizeOptionalValue(fields.total[index]),
      pcd: normalizeOptionalValue(fields.pcd[index]),
      race: normalizeOptionalValue(fields.race[index]),
      income: normalizeOptionalValue(fields.income[index]),
      workload: normalizeOptionalValue(fields.workload[index]),
      salary: normalizeOptionalValue(fields.salary[index]),
      zone: normalizeOptionalValue(fields.zone[index]),
      workplace: normalizeOptionalValue(fields.workplace[index])
    }))
    .filter((item) => Object.values(item).some(Boolean));
};

const parseStoredCollection = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('|').map((item) => item.trim()));
  }
};

const buildPublicSelectionPayload = (body, files) => ({
  title: normalizeOptionalValue(body.title),
  description: normalizeOptionalValue(body.description),
  category: body.category || 'processo_seletivo',
  processNumber: normalizeOptionalValue(body.processNumber),
  selectionType: normalizeOptionalValue(body.selectionType),
  legalRegime: normalizeOptionalValue(body.legalRegime),
  duration: normalizeOptionalValue(body.duration),
  isExtendable: body.isExtendable === 'on',
  status: normalizeOptionalValue(body.status) || 'Publicado',
  organizer: normalizeOptionalValue(body.organizer),
  destinationAgency: normalizeOptionalValue(body.destinationAgency),
  registrationLocation: normalizeOptionalValue(body.registrationLocation),
  noticePublicationDate: body.noticePublicationDate || null,
  registrationStartDate: body.registrationStartDate || null,
  registrationEndDate: body.registrationEndDate || null,
  targetAudience: normalizeOptionalValue(body.targetAudience),
  link: normalizeOptionalValue(body.link),
  schedule: JSON.stringify(normalizeScheduleItems(body)),
  vacancies: JSON.stringify(normalizeVacancyItems(body)),
  ...(files && files.image ? { image: files.image[0].filename } : {}),
  ...(files && files.noticePdf ? {
    noticePdf: files.noticePdf[0].filename,
    noticePdfOriginalName: files.noticePdf[0].originalname
  } : {})
});

const buildPaymentSummary = (contacts) => {
  const summary = {
    totalReceived: 0,
    totalPending: 0,
    totalUnderReview: 0,
    receivedCount: 0,
    pendingCount: 0,
    underReviewCount: 0
  };

  contacts.forEach((contact) => {
    if (!contact.paymentRequired) return;
    if (contact.paymentStatus === 'primeiro_mes_gratuito') return;

    const amount = parseCurrencyToNumber(contact.paymentAmount);

    if (contact.paymentStatus === 'pagamento_confirmado') {
      summary.totalReceived += amount;
      summary.receivedCount += 1;
      return;
    }

    if (contact.paymentStatus === 'pagamento_informado') {
      summary.totalUnderReview += amount;
      summary.underReviewCount += 1;
      return;
    }

    summary.totalPending += amount;
    summary.pendingCount += 1;
  });

  return {
    ...summary,
    totalReceivedLabel: formatCurrencyBRL(summary.totalReceived),
    totalPendingLabel: formatCurrencyBRL(summary.totalPending),
    totalUnderReviewLabel: formatCurrencyBRL(summary.totalUnderReview)
  };
};

const normalizeAdvertisementPlacement = (value) => {
  const allowedPlacements = new Set(['hero_top', 'mural_home']);
  return allowedPlacements.has(value) ? value : 'mural_home';
};

const normalizeAdvertisementGroupName = (value) => {
  const normalized = normalizeOptionalValue(value);
  return normalized || 'Geral';
};

const normalizeAdvertisementPosition = (value) => {
  const position = parseInt(value, 10);
  return Number.isInteger(position) && position > 0 ? position : 1;
};

exports.loginPage = (req, res) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { title: 'Login Admin', error: req.query.error });
};

exports.dashboard = async (req, res) => {
  try {
    const [jobCount, courseCount, publicSelectionCount, userCount, contactCount, recentContacts, allContacts] = await Promise.all([
      Job.count(),
      Course.count(),
      PublicSelection.count(),
      User.count({ where: { role: 'user' } }),
      ContactMessage.count(),
      ContactMessage.findAll({ order: [['createdAt', 'DESC']], limit: 5 }),
      ContactMessage.findAll({ order: [['createdAt', 'DESC']] })
    ]);
    const paymentSummary = buildPaymentSummary(allContacts);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      jobCount,
      courseCount,
      publicSelectionCount,
      userCount,
      contactCount,
      recentContacts,
      paymentSummary,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
};

exports.listJobs = async (req, res) => {
  const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/vagas/list', { title: 'Gerenciar Vagas', jobs, user: req.user });
};

exports.createJobForm = (req, res) => {
  res.render('admin/vagas/form', { title: 'Nova Vaga', job: null, user: req.user });
};

exports.createJob = async (req, res) => {
  try {
    const { title, description, link, startDate, endDate } = req.body;
    const image = req.file ? req.file.filename : '';
    await Job.create({
      title,
      description,
      link,
      image,
      startDate: startDate || null,
      endDate: endDate || null
    });
    res.redirect('/admin/vagas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar vaga');
  }
};

exports.editJobForm = async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  res.render('admin/vagas/form', { title: 'Editar Vaga', job, user: req.user });
};

exports.updateJob = async (req, res) => {
  try {
    const { title, description, link, startDate, endDate } = req.body;
    const updateData = {
      title,
      description,
      link,
      startDate: startDate || null,
      endDate: endDate || null
    };
    if (req.file) updateData.image = req.file.filename;
    await Job.update(updateData, { where: { id: req.params.id } });
    res.redirect('/admin/vagas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar vaga');
  }
};

exports.deleteJob = async (req, res) => {
  await Job.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/vagas');
};

exports.listCourses = async (req, res) => {
  const courses = await Course.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/cursos/list', { title: 'Gerenciar Cursos', courses, user: req.user });
};

exports.createCourseForm = (req, res) => {
  res.render('admin/cursos/form', { title: 'Novo Curso', course: null, user: req.user });
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, link, startDate, endDate } = req.body;
    const image = req.file ? req.file.filename : '';
    await Course.create({
      title,
      description,
      link,
      image,
      startDate: startDate || null,
      endDate: endDate || null
    });
    res.redirect('/admin/cursos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar curso');
  }
};

exports.editCourseForm = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  res.render('admin/cursos/form', { title: 'Editar Curso', course, user: req.user });
};

exports.updateCourse = async (req, res) => {
  try {
    const { title, description, link, startDate, endDate } = req.body;
    const updateData = {
      title,
      description,
      link,
      startDate: startDate || null,
      endDate: endDate || null
    };
    if (req.file) updateData.image = req.file.filename;
    await Course.update(updateData, { where: { id: req.params.id } });
    res.redirect('/admin/cursos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar curso');
  }
};

exports.deleteCourse = async (req, res) => {
  await Course.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/cursos');
};

exports.listPublicSelections = async (req, res) => {
  const publicSelections = await PublicSelection.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/public-selections/list', {
    title: 'Concursos e Processos Seletivos',
    publicSelections,
    user: req.user
  });
};

exports.createPublicSelectionForm = (req, res) => {
  res.render('admin/public-selections/form', {
    title: 'Nova seleção pública',
    publicSelection: null,
    scheduleItems: [{ label: '', date: '' }],
    vacancyItems: [{ role: '', total: '', pcd: '', race: '', income: '', workload: '', salary: '', zone: '', workplace: '' }],
    formError: req.query.error || null,
    user: req.user
  });
};

exports.createPublicSelection = async (req, res) => {
  try {
    const title = normalizeOptionalValue(req.body.title);

    if (!title) {
      return res.redirect('/admin/selecoes-publicas/nova?error=' + encodeURIComponent('O título de divulgação é obrigatório.'));
    }

    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.redirect('/admin/selecoes-publicas/nova?error=' + encodeURIComponent('A imagem de capa é obrigatória.'));
    }

    await PublicSelection.create(buildPublicSelectionPayload(req.body, req.files));
    res.redirect('/admin/selecoes-publicas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar seleção pública');
  }
};

exports.editPublicSelectionForm = async (req, res) => {
  const publicSelection = await PublicSelection.findByPk(req.params.id);
  const scheduleItems = parseStoredCollection(publicSelection.schedule).map((item) => ({
    label: item.label || item[0] || '',
    date: item.date || item[1] || ''
  }));
  const vacancyItems = parseStoredCollection(publicSelection.vacancies).map((item) => ({
    role: item.role || item[0] || '',
    total: item.total || item[1] || '',
    pcd: item.pcd || item[2] || '',
    race: item.race || item[3] || '',
    income: item.income || item[4] || '',
    workload: item.workload || item[5] || '',
    salary: item.salary || item[6] || '',
    zone: item.zone || item[7] || '',
    workplace: item.workplace || item[8] || ''
  }));
  res.render('admin/public-selections/form', {
    title: 'Editar seleção pública',
    publicSelection,
    scheduleItems: scheduleItems.length > 0 ? scheduleItems : [{ label: '', date: '' }],
    vacancyItems: vacancyItems.length > 0 ? vacancyItems : [{ role: '', total: '', pcd: '', race: '', income: '', workload: '', salary: '', zone: '', workplace: '' }],
    formError: req.query.error || null,
    user: req.user
  });
};

exports.updatePublicSelection = async (req, res) => {
  try {
    const publicSelection = await PublicSelection.findByPk(req.params.id);
    const title = normalizeOptionalValue(req.body.title);

    if (!title) {
      return res.redirect(`/admin/selecoes-publicas/editar/${req.params.id}?error=${encodeURIComponent('O título de divulgação é obrigatório.')}`);
    }

    if (!publicSelection) {
      return res.status(404).send('Seleção pública não encontrada');
    }

    if (!publicSelection.image && (!req.files || !req.files.image || req.files.image.length === 0)) {
      return res.redirect(`/admin/selecoes-publicas/editar/${req.params.id}?error=${encodeURIComponent('A imagem de capa é obrigatória.')}`);
    }

    await PublicSelection.update(buildPublicSelectionPayload(req.body, req.files), { where: { id: req.params.id } });
    res.redirect('/admin/selecoes-publicas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar seleção pública');
  }
};

exports.deletePublicSelection = async (req, res) => {
  await PublicSelection.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/selecoes-publicas');
};

exports.listAdvertisements = async (req, res) => {
  const advertisements = await Advertisement.findAll({
    order: [['placement', 'ASC'], ['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'DESC']]
  });
  const groupedAdvertisements = advertisements.reduce((accumulator, advertisement) => {
    const placement = advertisement.placement || 'mural_home';
    const groupName = advertisement.groupName || 'Geral';

    if (!accumulator[placement]) {
      accumulator[placement] = [];
    }

    let group = accumulator[placement].find((item) => item.groupName === groupName);
    if (!group) {
      group = { groupName, items: [] };
      accumulator[placement].push(group);
    }

    group.items.push(advertisement);
    return accumulator;
  }, {});

  res.render('admin/advertisements/list', {
    title: 'Mural publicitário',
    advertisements,
    groupedAdvertisements,
    user: req.user
  });
};

exports.createAdvertisementForm = (req, res) => {
  res.render('admin/advertisements/form', {
    title: 'Nova propaganda',
    advertisement: null,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.createAdvertisement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('A imagem da propaganda é obrigatória.');
    }

    await Advertisement.create({
      title: normalizeOptionalValue(req.body.title),
      description: normalizeOptionalValue(req.body.description),
      image: req.file.filename,
      link: normalizeOptionalValue(req.body.link),
      placement: normalizeAdvertisementPlacement(req.body.placement),
      groupName: normalizeAdvertisementGroupName(req.body.groupName),
      position: normalizeAdvertisementPosition(req.body.position),
      width: parseInt(req.body.width, 10) || 500,
      height: parseInt(req.body.height, 10) || 105,
      animation: req.body.animation || 'pulse',
      order: parseInt(req.body.order, 10) || 0,
      isActive: req.body.isActive === 'on'
    });
    res.redirect('/admin/propagandas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar propaganda');
  }
};

exports.editAdvertisementForm = async (req, res) => {
  const advertisement = await Advertisement.findByPk(req.params.id);
  res.render('admin/advertisements/form', {
    title: 'Editar propaganda',
    advertisement,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.updateAdvertisement = async (req, res) => {
  try {
    const updateData = {
      title: normalizeOptionalValue(req.body.title),
      description: normalizeOptionalValue(req.body.description),
      link: normalizeOptionalValue(req.body.link),
      placement: normalizeAdvertisementPlacement(req.body.placement),
      groupName: normalizeAdvertisementGroupName(req.body.groupName),
      position: normalizeAdvertisementPosition(req.body.position),
      width: parseInt(req.body.width, 10) || 500,
      height: parseInt(req.body.height, 10) || 105,
      animation: req.body.animation || 'pulse',
      order: parseInt(req.body.order, 10) || 0,
      isActive: req.body.isActive === 'on'
    };
    if (req.file) {
      updateData.image = req.file.filename;
    }
    await Advertisement.update(updateData, { where: { id: req.params.id } });
    res.redirect('/admin/propagandas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar propaganda');
  }
};

exports.deleteAdvertisement = async (req, res) => {
  await Advertisement.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/propagandas');
};

exports.listContacts = async (req, res) => {
  const contacts = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/contatos/list', {
    title: 'Mensagens de Contato',
    contacts,
    paymentSummary: buildPaymentSummary(contacts),
    user: req.user
  });
};

exports.updateContactStatus = async (req, res) => {
  const contact = await ContactMessage.findByPk(req.params.id);
  if (contact) {
    await contact.update({ status: req.body.status || 'novo' });
  }
  res.redirect('/admin/contatos');
};

exports.updateContactPaymentStatus = async (req, res) => {
  const contact = await ContactMessage.findByPk(req.params.id);
  if (contact) {
    const nextStatus = req.body.paymentStatus || 'pendente';
    await contact.update({
      paymentStatus: nextStatus,
      paymentConfirmedAt: nextStatus === 'pagamento_confirmado' || nextStatus === 'pagamento_informado'
        ? (contact.paymentConfirmedAt || new Date())
        : null
    });
  }
  res.redirect('/admin/contatos');
};

exports.deleteContact = async (req, res) => {
  await ContactMessage.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/contatos');
};

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
  res.render('admin/configuracoes', { title: 'Configurações de tema', s: setting, user: req.user, menuPreviewItems });
};

exports.updateSettings = async (req, res) => {
  try {
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
      brandName: normalizeOptionalValue(req.body.brandName) || 'Agência de Emprego',
      footerDescription: normalizeOptionalValue(req.body.footerDescription) || 'Agência de Emprego conecta vagas, cursos e orientação profissional em uma experiência mais clara e confiável.',
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
      heroTitle: normalizeOptionalValue(req.body.heroTitle) || 'Conecte talento, contratação e qualificação em uma vitrine que transmite confiança.',
      heroDescription: normalizeOptionalValue(req.body.heroDescription) || 'Sua agência agora apresenta vagas e cursos em uma experiência mais forte comercialmente: clara para quem busca oportunidade e convincente para quem quer divulgar serviços e atrair candidatos qualificados.',
      heroHeight: parseInt(req.body.heroHeight, 10) || 0,
      heroPadding: parseInt(req.body.heroPadding, 10) || 42,
      heroTitleSize: parseInt(req.body.heroTitleSize, 10) || 72,
      heroContentWidth: parseInt(req.body.heroContentWidth, 10) || 720,
      heroKickerSize: parseInt(req.body.heroKickerSize, 10) || 12,
      heroDescriptionSize: parseInt(req.body.heroDescriptionSize, 10) || 17,
      heroTextAlign: normalizeOptionalValue(req.body.heroTextAlign) || 'left',
      heroContentOffsetX: parseInt(req.body.heroContentOffsetX, 10) || 0,
      heroContentOffsetY: parseInt(req.body.heroContentOffsetY, 10) || 0,
      topAdsOffsetX: parseInt(req.body.topAdsOffsetX, 10) || 0,
      topAdsOffsetY: parseInt(req.body.topAdsOffsetY, 10) || 0,
      topAdsMaxWidth: parseInt(req.body.topAdsMaxWidth, 10) || 1200,
      topAdsAlignment: normalizeOptionalValue(req.body.topAdsAlignment) || 'center',
      muralAdsOffsetX: parseInt(req.body.muralAdsOffsetX, 10) || 0,
      muralAdsOffsetY: parseInt(req.body.muralAdsOffsetY, 10) || 0,
      muralAdsMaxWidth: parseInt(req.body.muralAdsMaxWidth, 10) || 1200,
      muralAdsAlignment: normalizeOptionalValue(req.body.muralAdsAlignment) || 'center',
      commercialPaymentLink: normalizeOptionalValue(req.body.commercialPaymentLink) || 'https://mpago.la/2BYr2CS',
      commercialPaymentAmount: normalizeOptionalValue(req.body.commercialPaymentAmount) || 'R$ 50,00',
      commercialPaymentPlan: normalizeOptionalValue(req.body.commercialPaymentPlan) || 'Mensal',
      commercialFreeTrialMonths: Math.max(parseInt(req.body.commercialFreeTrialMonths, 10) || 0, 0)
    };

    if (req.file) updateData.backgroundImage = req.file.filename;

    let setting = await Setting.findOne();
    if (setting) {
      await setting.update(updateData);
    } else {
      await Setting.create(updateData);
    }
    res.redirect('/admin/configuracoes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar modificações');
  }
};

exports.listMenus = async (req, res) => {
  await ensureDefaultMenus();
  const menus = await Menu.findAll({ order: [['order', 'ASC']] });
  res.render('admin/menus/list', { title: 'Gerenciar Menus', menus, user: req.user });
};

exports.menuForm = async (req, res) => {
  let menu = null;
  if (req.params.id) {
    menu = await Menu.findByPk(req.params.id);
  }
  res.render('admin/menus/form', { title: menu ? 'Editar Menu' : 'Novo Menu', menu, user: req.user });
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
  res.redirect('/admin/menus');
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
  res.redirect('/admin/menus');
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
  res.redirect('/admin/menus');
};

exports.listUsers = async (req, res) => {
  const users = await User.findAll({ where: { role: 'user' }, order: [['createdAt', 'DESC']] });
  res.render('admin/usuarios', { title: 'Listagem de usuários', users, user: req.user });
};


