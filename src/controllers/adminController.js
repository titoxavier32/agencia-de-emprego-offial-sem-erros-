module.exports = {
  ...require('./admin/dashboardController'),
  ...require('./admin/contentController'),
  ...require('./admin/settingsController'),
  ...require('./admin/usersController')
};
