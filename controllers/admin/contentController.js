const { Op } = require('sequelize');
const Job = require('../../models/Job');
const Course = require('../../models/Course');
const Advertisement = require('../../models/Advertisement');
const ContactMessage = require('../../models/ContactMessage');
const PublicSelection = require('../../models/PublicSelection');
const {
  buildAdvertisementPayload,
  buildAdvertisementVisualSections,
  buildCoursePayload,
  buildCourseUpdatePayload,
  buildJobPayload,
  buildJobUpdatePayload,
  buildPaymentSummary,
  buildPublicSelectionFormState,
  buildPublicSelectionPayload,
  buildSelectionErrorRedirect,
  getSelectionFile,
  getSingleFileName,
  normalizeAdvertisementGroupName,
  normalizeAdvertisementPlacement,
  normalizeAdvertisementPosition,
  normalizeOptionalValue
} = require('./helpers');

exports.listJobs = async (req, res) => {
  const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('admin/vagas/list', { title: 'Gerenciar Vagas', jobs, user: req.user });
};

exports.createJobForm = async (req, res) => res.render('admin/vagas/form', { title: 'Nova Vaga', job: null, user: req.user });

exports.createJob = async (req, res) => {
  await Job.create(buildJobPayload(req.body, getSingleFileName(req.file)));
  return res.redirect('/admin/vagas');
};

exports.editJobForm = async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  return res.render('admin/vagas/form', { title: 'Editar Vaga', job, user: req.user });
};

exports.updateJob = async (req, res) => {
  await Job.update(buildJobUpdatePayload(req.body, req.file), { where: { id: req.params.id } });
  return res.redirect('/admin/vagas');
};

exports.deleteJob = async (req, res) => {
  await Job.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/vagas');
};

exports.listCourses = async (req, res) => {
  const courses = await Course.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('admin/cursos/list', { title: 'Gerenciar Cursos', courses, user: req.user });
};

exports.createCourseForm = async (req, res) => res.render('admin/cursos/form', { title: 'Novo Curso', course: null, user: req.user });

exports.createCourse = async (req, res) => {
  await Course.create(buildCoursePayload(req.body, getSingleFileName(req.file)));
  return res.redirect('/admin/cursos');
};

exports.editCourseForm = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  return res.render('admin/cursos/form', { title: 'Editar Curso', course, user: req.user });
};

exports.updateCourse = async (req, res) => {
  await Course.update(buildCourseUpdatePayload(req.body, req.file), { where: { id: req.params.id } });
  return res.redirect('/admin/cursos');
};

exports.deleteCourse = async (req, res) => {
  await Course.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/cursos');
};

exports.listPublicSelections = async (req, res) => {
  const publicSelections = await PublicSelection.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('admin/public-selections/list', {
    title: 'Concursos e Processos Seletivos',
    publicSelections,
    user: req.user
  });
};

exports.createPublicSelectionForm = async (req, res) => {
  const formState = buildPublicSelectionFormState();
  return res.render('admin/public-selections/form', {
    title: 'Nova selecao publica',
    publicSelection: formState.publicSelection,
    scheduleItems: formState.scheduleItems,
    vacancyItems: formState.vacancyItems,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.createPublicSelection = async (req, res) => {
  const title = normalizeOptionalValue(req.body.title);

  if (!title) {
    return res.redirect(buildSelectionErrorRedirect('/admin/selecoes-publicas/nova', 'O titulo de divulgacao e obrigatorio.'));
  }

  if (!getSelectionFile(req.files, 'image')) {
    return res.redirect(buildSelectionErrorRedirect('/admin/selecoes-publicas/nova', 'A imagem de capa e obrigatoria.'));
  }

  await PublicSelection.create(buildPublicSelectionPayload(req.body, req.files));
  return res.redirect('/admin/selecoes-publicas');
};

exports.editPublicSelectionForm = async (req, res) => {
  const publicSelection = await PublicSelection.findByPk(req.params.id);
  const formState = buildPublicSelectionFormState(publicSelection);

  return res.render('admin/public-selections/form', {
    title: 'Editar selecao publica',
    publicSelection: formState.publicSelection,
    scheduleItems: formState.scheduleItems,
    vacancyItems: formState.vacancyItems,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.updatePublicSelection = async (req, res) => {
  const publicSelection = await PublicSelection.findByPk(req.params.id);
  const title = normalizeOptionalValue(req.body.title);
  const editPath = `/admin/selecoes-publicas/editar/${req.params.id}`;

  if (!title) {
    return res.redirect(buildSelectionErrorRedirect(editPath, 'O titulo de divulgacao e obrigatorio.'));
  }

  if (!publicSelection) {
    return res.status(404).send('Selecao publica nao encontrada');
  }

  if (!publicSelection.image && !getSelectionFile(req.files, 'image')) {
    return res.redirect(buildSelectionErrorRedirect(editPath, 'A imagem de capa e obrigatoria.'));
  }

  await PublicSelection.update(buildPublicSelectionPayload(req.body, req.files), { where: { id: req.params.id } });
  return res.redirect('/admin/selecoes-publicas');
};

exports.deletePublicSelection = async (req, res) => {
  await PublicSelection.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/selecoes-publicas');
};

exports.listAdvertisements = async (req, res) => {
  const advertisements = await Advertisement.findAll({
    order: [['placement', 'ASC'], ['groupName', 'ASC'], ['position', 'ASC'], ['order', 'ASC'], ['createdAt', 'DESC']]
  });

  const groupedAdvertisements = advertisements.reduce((accumulator, advertisement) => {
    const placement = advertisement.placement || 'mural_home';
    const groupName = advertisement.groupName || 'Geral';

    if (!accumulator[placement]) accumulator[placement] = [];

    let group = accumulator[placement].find((item) => item.groupName === groupName);
    if (!group) {
      group = { groupName, items: [] };
      accumulator[placement].push(group);
    }

    group.items.push(advertisement);
    return accumulator;
  }, {});

  return res.render('admin/advertisements/list', {
    title: 'Mural publicitario',
    advertisements,
    groupedAdvertisements,
    visualSections: buildAdvertisementVisualSections(advertisements),
    user: req.user
  });
};

exports.createAdvertisementForm = async (req, res) => {
  const advertisement = {
    placement: normalizeAdvertisementPlacement(req.query.placement),
    groupName: normalizeAdvertisementGroupName(req.query.groupName),
    position: normalizeAdvertisementPosition(req.query.position),
    width: parseInt(req.query.width, 10) || 500,
    height: parseInt(req.query.height, 10) || 105,
    animation: req.query.animation || 'pulse',
    order: parseInt(req.query.order, 10) || 0,
    isActive: true,
    title: '',
    description: '',
    link: ''
  };

  return res.render('admin/advertisements/form', {
    title: 'Nova propaganda',
    advertisement,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.createAdvertisement = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('A imagem da propaganda e obrigatoria.');
  }

  await Advertisement.create(buildAdvertisementPayload(req.body, req.file));
  return res.redirect('/admin/propagandas');
};

exports.editAdvertisementForm = async (req, res) => {
  const advertisement = await Advertisement.findByPk(req.params.id);
  return res.render('admin/advertisements/form', {
    title: 'Editar propaganda',
    advertisement,
    formError: req.query.error || null,
    user: req.user
  });
};

exports.updateAdvertisement = async (req, res) => {
  await Advertisement.update(buildAdvertisementPayload(req.body, req.file), { where: { id: req.params.id } });
  return res.redirect('/admin/propagandas');
};

exports.repositionAdvertisement = async (req, res) => {
  const advertisement = await Advertisement.findByPk(req.params.id);

  if (!advertisement) {
    return res.status(404).json({ error: 'Propaganda nao encontrada.' });
  }

  const placement = normalizeAdvertisementPlacement(req.body.placement);
  const groupName = normalizeAdvertisementGroupName(req.body.groupName);
  const position = normalizeAdvertisementPosition(req.body.position);

  await Advertisement.sequelize.transaction(async (transaction) => {
    const targetOccupant = await Advertisement.findOne({
      where: {
        placement,
        groupName,
        position,
        id: { [Op.ne]: advertisement.id }
      },
      transaction
    });

    const previousPlacement = advertisement.placement;
    const previousGroupName = advertisement.groupName;
    const previousPosition = advertisement.position;

    await advertisement.update({ placement, groupName, position }, { transaction });

    if (targetOccupant) {
      await targetOccupant.update({
        placement: previousPlacement,
        groupName: previousGroupName,
        position: previousPosition
      }, { transaction });
    }
  });

  return res.json({ ok: true });
};

exports.deleteAdvertisement = async (req, res) => {
  await Advertisement.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/propagandas');
};

exports.listContacts = async (req, res) => {
  const contacts = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] });
  return res.render('admin/contatos/list', {
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
  return res.redirect('/admin/contatos');
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
  return res.redirect('/admin/contatos');
};

exports.deleteContact = async (req, res) => {
  await ContactMessage.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/contatos');
};
