const VisitorLog = require('../models/VisitorLog');

module.exports = async (req, res, next) => {
  // Ignorar requisições que não sejam GET de páginas (ex: assets, chamadas AJAX de dados se houver)
  if (req.method !== 'GET' || req.path.includes('.') || req.path.startsWith('/admin')) {
    return next();
  }

  try {
    // Registro assíncrono para não travar a renderização
    VisitorLog.create({
      path: req.path,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      referrer: req.headers['referer'] || req.headers['referrer']
    }).catch(err => console.error('Error logging visitor:', err));
  } catch (error) {
    console.error('Visitor tracker error:', error);
  }

  next();
};
