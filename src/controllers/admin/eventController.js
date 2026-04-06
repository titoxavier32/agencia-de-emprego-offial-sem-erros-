const Event = require('../../models/Event');
const {
  buildEventPayload,
  buildEventUpdatePayload,
  getSingleFileName
} = require('./helpers');

exports.listEvents = async (req, res) => {
  const events = await Event.findAll({ order: [['date', 'ASC'], ['createdAt', 'DESC']] });
  return res.render('admin/events/list', { title: 'Gerenciar Eventos', events, user: req.user });
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
