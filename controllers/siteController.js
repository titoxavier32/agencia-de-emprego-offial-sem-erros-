const Job = require('../models/Job');
const Course = require('../models/Course');
const ContactMessage = require('../models/ContactMessage');
const PublicSelection = require('../models/PublicSelection');
const Advertisement = require('../models/Advertisement');
const Setting = require('../models/Setting');
const crypto = require('crypto');
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

exports.home = async (req, res) => {
  try {
    const [heroAdvertisements, muralAdvertisements, courses, jobs, publicSelections] = await Promise.all([
      Advertisement.findAll({ where: { isActive: true, placement: 'hero_top' }, order: [['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'DESC']], limit: 3 }),
      Advertisement.findAll({ where: { isActive: true, placement: 'mural_home' }, order: [['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'DESC']], limit: 3 }),
      Course.findAll({ order: [['createdAt', 'DESC']], limit: 6 }),
      Job.findAll({ order: [['createdAt', 'DESC']], limit: 6 }),
      PublicSelection.findAll({ order: [['createdAt', 'DESC']], limit: 4 })
    ]);
    res.render('site/home', { title: 'Página inicial', heroAdvertisements, muralAdvertisements, courses, jobs, publicSelections });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.vagas = async (req, res) => {
  try {
    const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
    res.render('site/vagas', { title: 'Vagas de Emprego', jobs });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.cursos = async (req, res) => {
  try {
    const courses = await Course.findAll({ order: [['createdAt', 'DESC']] });
    res.render('site/cursos', { title: 'Cursos disponíveis', courses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.publicSelections = async (req, res) => {
  try {
    const publicSelections = await PublicSelection.findAll({ order: [['createdAt', 'DESC']] });
    res.render('site/public-selections', {
      title: 'Concursos e Processos Seletivos',
      publicSelections
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.advertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.findAll({
      where: { isActive: true, placement: 'mural_home' },
      order: [['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'DESC']]
    });
    const advertisementGroups = advertisements.reduce((accumulator, advertisement) => {
      const groupName = advertisement.groupName || 'Geral';

      if (!accumulator[groupName]) {
        accumulator[groupName] = [];
      }

      accumulator[groupName].push(advertisement);
      return accumulator;
    }, {});

    res.render('site/advertisements', { title: 'Mural publicitário', advertisements, advertisementGroups });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.publicSelectionDetail = async (req, res) => {
  try {
    const publicSelection = await PublicSelection.findByPk(req.params.id);

    if (!publicSelection) {
      return res.status(404).render('site/sobre', { title: 'Seleção não encontrada' });
    }

    res.render('site/public-selection-detail', {
      title: publicSelection.title,
      publicSelection,
      scheduleRows: parsePipeTable(publicSelection.schedule),
      vacancyRows: parsePipeTable(publicSelection.vacancies)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
};

exports.sobre = (req, res) => {
  res.render('site/sobre', { title: 'Sobre nós' });
};

exports.contato = async (req, res) => {
  return await renderContactForm(
    res,
    buildContactFormData(),
    req.query.status || null,
    req.query.error || null
  );
};

exports.submitContato = async (req, res) => {
  const { name, email, phone, category, subject, preferredReply, message } = req.body;

  if (!name || !email || !message) {
    return await renderContactForm(res, buildContactFormData({
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
    console.error(error);
    return await renderContactForm(
      res,
      buildContactFormData({ name, email, phone, category, subject, preferredReply, message }),
      'error',
      error.message || null,
      500
    );
  }
};

exports.contactUploadError = async (req, res) => {
  return await renderContactForm(
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

    return res.render('site/contact-payment', {
      title: 'Pagamento da divulgação',
      contact,
      paymentLink: contact.paymentLink || paymentConfig.paymentLink,
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

