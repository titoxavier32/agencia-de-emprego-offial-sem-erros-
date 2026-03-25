module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/admin/login');
  },
  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    // If authenticated but not admin, perhaps redirect to user profile
    if (req.isAuthenticated() && req.user.role === 'user') {
      return res.redirect('/perfil');
    }
    res.redirect('/admin/login');
  },
  ensureGuest: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/perfil');
    }
  }
};
