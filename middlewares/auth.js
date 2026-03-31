const resolveRoleHome = (user) => {
  if (!user) return '/acesso-candidato?section=login';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'empresa') return '/perfil';
  return '/perfil';
};

const ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/acesso-candidato?section=login');
};

const ensureRole = (allowedRoles, fallbackPath = '/perfil') => function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/acesso-candidato?section=login');
  }

  if (allowedRoles.includes(req.user.role)) {
    return next();
  }

  return res.redirect(fallbackPath || resolveRoleHome(req.user));
};

const ensureApprovedCompany = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/acesso-candidato?section=login');
  }

  if (req.user.role !== 'empresa') {
    return res.redirect('/perfil');
  }

  if (req.user.status !== 'ativo') {
    return res.redirect('/perfil?error=' + encodeURIComponent('Sua empresa ainda nao foi aprovada pelo administrador para publicar vagas.'));
  }

  return next();
};

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureAdmin: ensureRole(['admin'], '/perfil'),
  ensureCompany: ensureRole(['empresa'], '/perfil'),
  ensureApprovedCompany,
  ensureCandidate: ensureRole(['candidato', 'user'], '/perfil'),
  ensureGuest: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    return res.redirect(resolveRoleHome(req.user));
  }
};
