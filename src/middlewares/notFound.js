const notFound = (req, res, next) => {
  const error = new Error('Pagina nao encontrada.');
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
