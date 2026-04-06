const resolveTargetPath = (targetPath, req) => (
  typeof targetPath === 'function' ? targetPath(req) : targetPath
);

const withUploadErrorHandling = (uploadMiddleware, onError) => (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (!error) {
      return next();
    }

    return Promise.resolve(onError(error, req, res, next)).catch(next);
  });
};

const createRedirectUploadHandler = (uploadMiddleware, targetPath, getMessage) => (
  withUploadErrorHandling(uploadMiddleware, (error, req, res) => {
    const message = getMessage
      ? getMessage(error, req)
      : (error.message || 'Nao foi possivel processar o arquivo enviado.');

    return res.redirect(`${resolveTargetPath(targetPath, req)}?error=${encodeURIComponent(message)}`);
  })
);

module.exports = {
  withUploadErrorHandling,
  createRedirectUploadHandler
};
