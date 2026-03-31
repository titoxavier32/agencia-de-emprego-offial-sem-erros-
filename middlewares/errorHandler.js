const isJsonRequest = (req) => {
  const acceptedType = req.accepts(['html', 'json']);
  return acceptedType === 'json' || req.originalUrl.startsWith('/api/');
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const message = statusCode >= 500
    ? 'Erro interno do servidor.'
    : (error.message || 'Nao foi possivel concluir a solicitacao.');

  console.error(`[${req.method} ${req.originalUrl}]`, error);

  if (isJsonRequest(req)) {
    return res.status(statusCode).json({ error: message });
  }

  return res.status(statusCode).render('site/sobre', {
    title: statusCode === 404 ? 'Pagina nao encontrada' : 'Erro interno',
    errorMessage: message
  });
};

module.exports = errorHandler;
