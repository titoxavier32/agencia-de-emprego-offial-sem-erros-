module.exports = {
  ...require('./admin/dashboardController'),
  ...require('./admin/contentController'),
  ...require('./admin/settingsController'),
  ...require('./admin/usersController'),
  ...require('./admin/eventController'),
  ...require('./admin/surveyController')
};
