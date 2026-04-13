const { Op } = require('sequelize');
const Event = require('../../models/Event');
const {
  buildEventPayload,
  buildEventUpdatePayload,
  getSingleFileName
} = require('./helpers');

exports.listEvents = async (req, res) => {
  const { q, status } = req.query;
  const where = {};

  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { location: { [Op.like]: `%${q}%` } },
      { organizer: { [Op.like]: `%${q}%` } }
    ];
  }

  if (status) {
    where.status = status;
  }

  const events = await Event.findAll({ 
    where,
    order: [['showInHero', 'DESC'], ['heroOrder', 'ASC'], ['date', 'ASC'], ['createdAt', 'DESC']] 
  });

  // Estatísticas para o Dashboard
  const stats = {
    total: await Event.count(),
    active: await Event.count({ where: { status: 'ativo' } }),
    hero: await Event.count({ where: { showInHero: true, status: 'ativo' } }),
    free: await Event.count({ where: { isFree: true } }),
    other: await Event.count({ where: { status: { [Op.ne]: 'ativo' } } })
  };

  return res.render('admin/events/list', { 
    title: 'Gerenciar Eventos', 
    events, 
    stats,
    filters: { q, status },
    user: req.user 
  });
};

exports.createEventForm = async (req, res) => res.render('admin/events/form', { title: 'Novo Evento', event: null, user: req.user });

exports.createEvent = async (req, res) => {
  await Event.create(buildEventPayload(req.body, getSingleFileName(req.file)));
  return res.redirect('/admin/events');
};

exports.editEventForm = async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  return res.render('admin/events/form', { title: 'Editar Evento', event, user: req.user });
};

exports.updateEvent = async (req, res) => {
  await Event.update(buildEventUpdatePayload(req.body, req.file), { where: { id: req.params.id } });
  return res.redirect('/admin/events');
};

exports.deleteEvent = async (req, res) => {
  await Event.destroy({ where: { id: req.params.id } });
  return res.redirect('/admin/events');
};
