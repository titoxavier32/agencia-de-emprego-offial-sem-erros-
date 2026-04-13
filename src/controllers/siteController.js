const Job = require('../models/Job');
const Course = require('../models/Course');
const ContactMessage = require('../models/ContactMessage');
const PublicSelection = require('../models/PublicSelection');
const Advertisement = require('../models/Advertisement');
const Setting = require('../models/Setting');
const User = require('../models/User');
const Event = require('../models/Event');
const SatisfactionSurvey = require('../models/SatisfactionSurvey');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { createPaymentPreference, getAccessToken } = require('../utils/mercadopagoService');
const { parseCurrencyToNumber } = require('./admin/helpers');
const PAID_CONTACT_CATEGORIES = new Set([
  'parceria_comercial',
  'divulgacao_curso',
  'divulgacao_vaga',
  'propaganda'
]);

const getCategoryLabel = (category) => {
  const labels = {
    contato_geral: 'Contato geral',
    feedback: 'Feedback',
    suporte: 'Suporte',
    parceria_comercial: 'Parceria comercial',
    divulgacao_curso: 'Divulgação de cursos',
    divulgacao_vaga: 'Divulgação de vaga de emprego',
    propaganda: 'Propaganda',
    institucional: 'Institucional'
  };

  return labels[category] || 'Contato';
};

const requiresPayment = (category) => PAID_CONTACT_CATEGORIES.has(category);
const createNotFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const buildContactFormData = (data = {}) => ({
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  category: data.category || 'contato_geral',
  subject: data.subject || '',
  preferredReply: data.preferredReply || 'email',
  message: data.message || ''
});

const getCommercialPaymentConfig = async () => {
  const setting = await Setting.findOne();

  return {
    paymentLink: setting && setting.commercialPaymentLink ? setting.commercialPaymentLink : 'https://mpago.la/2BYr2CS',
    paymentAmount: setting && setting.commercialPaymentAmount ? setting.commercialPaymentAmount : 'R$ 50,00',
    paymentPlan: setting && setting.commercialPaymentPlan ? setting.commercialPaymentPlan : 'Mensal',
    freeTrialMonths: setting && Number.isInteger(setting.commercialFreeTrialMonths) ? setting.commercialFreeTrialMonths : 1
  };
};

const renderContactForm = async (res, formData, contactStatus = null, contactError = null, statusCode = 200) => {
  const paymentConfig = await getCommercialPaymentConfig();
  return res.status(statusCode).render('site/contato', {
    title: 'Contato',
    contactStatus,
    contactError,
    formData,
    paymentLink: paymentConfig.paymentLink,
    paymentAmount: paymentConfig.paymentAmount,
    paymentPlan: paymentConfig.paymentPlan,
    commercialFreeTrialMonths: paymentConfig.freeTrialMonths
  });
};

const parsePipeTable = (content) => {
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // Fallback for legacy plain-text values.
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((item) => item.trim()).filter(Boolean))
    .filter((columns) => columns.length > 0);
};

const buildAdvertisementGroups = (advertisements) => {
  const grouped = advertisements.reduce((accumulator, advertisement) => {
    const groupName = advertisement.groupName || 'Geral';

    if (!accumulator[groupName]) {
      accumulator[groupName] = [];
    }

    accumulator[groupName].push(advertisement);
    return accumulator;
  }, {});

  return Object.keys(grouped)
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    .map((groupName) => ({
      groupName,
      items: grouped[groupName].sort((left, right) => {
        if ((left.position || 1) !== (right.position || 1)) {
          return (left.position || 1) - (right.position || 1);
        }

        if ((left.order || 0) !== (right.order || 0)) {
          return (left.order || 0) - (right.order || 0);
        }

        return new Date(left.createdAt) - new Date(right.createdAt);
      })
    }));
};

const findOrderedAdvertisements = (placement) => Advertisement.findAll({
  where: { isActive: true, placement },
  order: [['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'ASC']]
});

const findHomeHeroEvents = () => Event.findAll({
  where: { status: 'ativo', showInHero: true },
  order: [['heroOrder', 'ASC'], ['date', 'ASC'], ['createdAt', 'DESC']],
  limit: 8
});

const findHomeHeroPublicSelections = () => PublicSelection.findAll({
  where: { showInHero: true },
  order: [['heroOrder', 'ASC'], ['createdAt', 'DESC']],
  limit: 8
});

const findPublicCompanies = (options = {}) => User.findAll({
  where: { role: 'empresa', status: 'ativo', companyShowcaseEnabled: true, companyShowcaseLgpdConsent: true },
  order: [['companyShowcaseOrder', 'ASC'], ['createdAt', 'DESC']],
  ...(options.limit ? { limit: options.limit } : {})
});

const buildPublicCompanyShowcaseItems = (companies) => companies.map((company) => ({
  id: company.id,
  displayName: company.companyPublicDisplayName || company.companyTradeName || company.companyLegalName || company.name || 'Empresa cadastrada',
  summary: company.companyPublicSummary || 'Empresa cadastrada na plataforma com vagas em divulgacao.',
  sector: company.companySector || '',
  city: company.city || '',
  state: company.state || '',
  website: company.companyWebsite || '',
  logo: company.avatar || '',
  order: company.companyShowcaseOrder || 0
})).sort((left, right) => left.order - right.order || left.displayName.localeCompare(right.displayName, 'pt-BR'));

exports.home = async (req, res) => {
  const [heroAdvertisements, muralAdvertisements, courses, jobs, publicSelections, companies, featuredHeroEvents, featuredHeroPublicSelections] = await Promise.all([
    findOrderedAdvertisements('hero_top'),
    findOrderedAdvertisements('mural_home'),
    Course.findAll({ order: [['createdAt', 'DESC']], limit: 6 }),
    Job.findAll({ where: { status: 'ativa' }, order: [['createdAt', 'DESC']], limit: 6 }),
    PublicSelection.findAll({ order: [['createdAt', 'DESC']], limit: 4 }),
    findPublicCompanies({ limit: 18 }),
    findHomeHeroEvents(),
    findHomeHeroPublicSelections()
  ]);

  return res.render('site/home', {
    title: 'Página inicial',
    heroAdvertisements,
    muralAdvertisements,
    heroAdvertisementGroups: buildAdvertisementGroups(heroAdvertisements),
    muralAdvertisementGroups: buildAdvertisementGroups(muralAdvertisements),
    courses,
    jobs,
    publicSelections,
    publicCompanies: buildPublicCompanyShowcaseItems(companies),
    featuredHeroEvents,
    featuredHeroPublicSelections
  });
};

exports.partnerCompanies = async (req, res) => {
  const companies = await findPublicCompanies();

  return res.render('site/partner-companies', {
    title: 'Empresas parceiras',
    publicCompanies: buildPublicCompanyShowcaseItems(companies)
  });
};

exports.privacyPolicy = (req, res) => {
  res.render('site/privacy-policy', { title: 'Política de privacidade' });
};

exports.termsOfUse = (req, res) => {
  res.render('site/terms-of-use', { title: 'Termos de uso' });
};

exports.vagas = async (req, res) => {
  const jobs = await Job.findAll({ where: { status: 'ativa' }, order: [['createdAt', 'DESC']] });
  return res.render('site/vagas', { title: 'Vagas de Emprego', jobs, status: req.query.status || null, error: req.query.error || null });
};

exports.cursos = async (req, res) => {
  const courses = await Course.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('site/cursos', { title: 'Cursos disponíveis', courses });
};

exports.publicSelections = async (req, res) => {
  const publicSelections = await PublicSelection.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('site/public-selections', {
    title: 'Concursos e Processos Seletivos',
    publicSelections
  });
};

exports.advertisements = async (req, res) => {
  const advertisements = await findOrderedAdvertisements('mural_home');

  return res.render('site/advertisements', {
    title: 'Mural publicitário',
    advertisements,
    advertisementGroups: buildAdvertisementGroups(advertisements)
  });
};

exports.eventos = async (req, res) => {
  const events = await Event.findAll({
    where: { status: 'ativo' },
    order: [['date', 'ASC'], ['time', 'ASC']]
  });
  return res.render('site/events', { title: 'Eventos e Workshops', events });
};

exports.busca = async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.render('site/search-results', { 
      title: 'Resultados da busca', 
      query, 
      results: { jobs: [], courses: [], selections: [], events: [] } 
    });
  }

  const searchCondition = { [Op.like]: `%${query}%` };

  const [jobs, courses, selections, events] = await Promise.all([
    Job.findAll({
      where: {
        status: 'ativa',
        [Op.or]: [
          { title: searchCondition },
          { description: searchCondition }
        ]
      },
      limit: 20
    }),
    Course.findAll({
      where: {
        [Op.or]: [
          { title: searchCondition },
          { description: searchCondition }
        ]
      },
      limit: 20
    }),
    PublicSelection.findAll({
      where: {
        [Op.or]: [
          { title: searchCondition },
          { description: searchCondition },
          { organizer: searchCondition }
        ]
      },
      limit: 20
    }),
    Event.findAll({
      where: {
        status: 'ativo',
        [Op.or]: [
          { title: searchCondition },
          { description: searchCondition },
          { location: searchCondition }
        ]
      },
      limit: 20
    })
  ]);

  return res.render('site/search-results', {
    title: `Resultados para "${query}"`,
    query,
    results: { jobs, courses, selections, events }
  });
};

exports.publicSelectionDetail = async (req, res) => {
  const publicSelection = await PublicSelection.findByPk(req.params.id);

  if (!publicSelection) {
    throw createNotFoundError('Seleção não encontrada.');
  }

  return res.render('site/public-selection-detail', {
    title: publicSelection.title,
    publicSelection,
    scheduleRows: parsePipeTable(publicSelection.schedule),
    vacancyRows: parsePipeTable(publicSelection.vacancies)
  });
};

exports.sobre = (req, res) => {
  res.render('site/sobre', { title: 'Quem Somos' });
};

exports.contato = async (req, res) => {
  return renderContactForm(
    res,
    buildContactFormData(),
    req.query.status || null,
    req.query.error || null
  );
};

exports.submitContato = async (req, res) => {
  const { name, email, phone, category, subject, preferredReply, message } = req.body;

  if (!name || !email || !message) {
    return renderContactForm(res, buildContactFormData({
      name,
      email,
      phone,
      category,
      subject,
      preferredReply,
      message
    }), 'error', null, 400);
  }

  try {
    const paymentConfig = await getCommercialPaymentConfig();
    const pdfFile = req.files && req.files.attachmentPdf ? req.files.attachmentPdf[0] : null;
    const imageFile = req.files && req.files.attachmentImage ? req.files.attachmentImage[0] : null;
    const selectedCategory = category || 'contato_geral';
    const paymentRequired = requiresPayment(selectedCategory);
    const paymentToken = paymentRequired ? crypto.randomBytes(18).toString('hex') : null;
    const hasFreeTrial = paymentRequired && paymentConfig.freeTrialMonths > 0;

    const contact = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      category: selectedCategory,
      subject: subject ? subject.trim() : '',
      preferredReply: preferredReply || 'email',
      paymentRequired,
      paymentStatus: paymentRequired ? (hasFreeTrial ? 'primeiro_mes_gratuito' : 'pendente') : 'nao_aplicavel',
      paymentMethod: paymentRequired ? 'mercado_pago' : '',
      paymentLink: paymentRequired ? paymentConfig.paymentLink : '',
      paymentAmount: paymentRequired ? paymentConfig.paymentAmount : '',
      paymentToken,
      pdfAttachment: pdfFile ? ('contact-attachments/' + pdfFile.filename) : '',
      pdfAttachmentOriginalName: pdfFile ? pdfFile.originalname : '',
      pdfAttachmentMimeType: pdfFile ? pdfFile.mimetype : '',
      imageAttachment: imageFile ? ('contact-attachments/' + imageFile.filename) : '',
      imageAttachmentOriginalName: imageFile ? imageFile.originalname : '',
      imageAttachmentMimeType: imageFile ? imageFile.mimetype : '',
      message: message.trim()
    });

    if (paymentRequired) {
      return res.redirect(`/contato/pagamento/${contact.id}?token=${contact.paymentToken}`);
    }

    res.redirect('/contato?status=success');
  } catch (error) {
    return renderContactForm(
      res,
      buildContactFormData({ name, email, phone, category, subject, preferredReply, message }),
      'error',
      error.message || null,
      500
    );
  }
};

exports.contactUploadError = async (req, res) => {
  return renderContactForm(
    res,
    buildContactFormData(req.body),
    'error',
    req.uploadError || 'Não foi possível processar o anexo enviado.',
    400
  );
};

exports.contactPaymentStep = async (req, res) => {
  try {
    const contact = await ContactMessage.findByPk(req.params.id);
    const paymentConfig = await getCommercialPaymentConfig();

    if (!contact || !contact.paymentRequired || req.query.token !== contact.paymentToken) {
      return res.redirect('/contato?error=Pagamento não encontrado');
    }

    let paymentLink = contact.paymentLink || paymentConfig.paymentLink;
    let initPoint = null;

    const mpAccessToken = await getAccessToken();
    if (mpAccessToken) {
      try {
        const priceValue = parseCurrencyToNumber(paymentConfig.paymentAmount);
        const preference = await createPaymentPreference({
          title: `Divulgação ${getCategoryLabel(contact.category)}`,
          description: `Plano ${paymentConfig.paymentPlan} - ${contact.name}`,
          price: priceValue,
          quantity: 1,
          externalReference: contact.id.toString(),
          notificationUrl: `${req.protocol}://${req.get('host')}/webhooks/mercadopago`
        });
        if (preference && preference.init_point) {
          initPoint = preference.init_point;
          paymentLink = initPoint;
          await contact.update({ paymentLink });
        }
      } catch (mpError) {
        console.error('Erro ao criar preferência MercadoPago:', mpError.message);
      }
    }

    return res.render('site/contact-payment', {
      title: 'Pagamento da divulgação',
      contact,
      paymentLink,
      paymentAmount: contact.paymentAmount || paymentConfig.paymentAmount,
      paymentPlan: paymentConfig.paymentPlan,
      commercialFreeTrialMonths: paymentConfig.freeTrialMonths,
      categoryLabel: getCategoryLabel(contact.category),
      paymentStatus: req.query.status || null
    });
  } catch (error) {
    console.error(error);
    return res.redirect('/contato?error=Pagamento não encontrado');
  }
};

exports.confirmContactPayment = async (req, res) => {
  try {
    const contact = await ContactMessage.findByPk(req.params.id);

    if (!contact || !contact.paymentRequired || req.body.token !== contact.paymentToken) {
      return res.redirect('/contato?error=Pagamento não encontrado');
    }

    await contact.update({
      paymentStatus: 'pagamento_informado',
      paymentConfirmedAt: new Date()
    });

    return res.redirect(`/contato/pagamento/${contact.id}?token=${contact.paymentToken}&status=confirmed`);
  } catch (error) {
    console.error(error);
    return res.redirect('/contato?error=Não foi possível confirmar o pagamento');
  }
};

exports.submitSatisfactionSurvey = async (req, res) => {
  const { rating, comment, page } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'A avaliacao deve ser entre 1 e 5.' });
  }

  try {
    await SatisfactionSurvey.create({
      rating: parseInt(rating, 10),
      comment: (comment || '').trim(),
      visitorIp: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      page: page || req.headers['referer'] || '/'
    });

    return res.json({ success: true, message: 'Obrigado pelo seu feedback!' });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return res.status(500).json({ error: 'Nao foi possivel processar sua avaliacao.' });
  }
};

