const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { sendMail } = require('../utils/emailService');

const normalizeOptionalValue = (value) => value ? String(value).trim() : '';
const normalizeDocument = (value) => normalizeOptionalValue(value).replace(/\D/g, '');
const buildAccessRedirect = (message, section = '') => `/acesso-candidato?error=${encodeURIComponent(message)}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
const buildAccessStatusRedirect = (message, section = '') => `/acesso-candidato?status=${encodeURIComponent(message)}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
const buildAccessResetRedirect = (message, section = '', resetToken = '', type = 'status') => `/acesso-candidato?${type}=${encodeURIComponent(message)}${section ? `&section=${encodeURIComponent(section)}` : ''}${resetToken ? `&resetToken=${encodeURIComponent(resetToken)}` : ''}`;
const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));
const generateResetToken = () => crypto.randomBytes(24).toString('hex');
const PASSWORD_RESET_EXPIRATION_MINUTES = 10;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_RESEND_SECONDS = 60;

const findPasswordResetUserByToken = async (token) => {
  const normalizedToken = normalizeOptionalValue(token);
  if (!normalizedToken) return null;
  return User.findOne({ where: { passwordResetTokenHash: hashValue(normalizedToken) } });
};

const resetPasswordRecoveryState = (user) => user.update({
  passwordResetTokenHash: null,
  passwordResetCodeHash: null,
  passwordResetExpiresAt: null,
  passwordResetAttemptCount: 0,
  passwordResetLastSentAt: null,
  passwordResetVerifiedAt: null
});

const sendPasswordResetCode = async (user, code) => {
  const subject = 'Código de verificação - Agência de Emprego';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
      <h2 style="margin-bottom:8px;">Recuperar acesso à conta</h2>
      <p>Recebemos uma solicitação para recuperação de acesso à sua conta.</p>
      <p>Use o código abaixo para continuar:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;padding:14px 18px;background:#eff6ff;border-radius:12px;display:inline-block;">${code}</div>
      <p style="margin-top:16px;">Este código é válido por ${PASSWORD_RESET_EXPIRATION_MINUTES} minutos.</p>
      <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
      <p style="margin-top:20px;">Equipe Ag?ncia de Emprego</p>
    </div>
  `;
  const text = `Recuperar acesso à conta\n\nRecebemos uma solicitação para recuperação de acesso à sua conta.\n\nSeu código de verificação é: ${code}\n\nEste código é válido por ${PASSWORD_RESET_EXPIRATION_MINUTES} minutos.\n\nSe você não solicitou esta recuperação, ignore este e-mail.\n\nEquipe Agência de Emprego`;
  await sendMail({ to: user.email, subject, html, text });
};
const resolveRoleHome = (user) => {
  if (!user) return '/acesso-candidato?section=login';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'empresa') return '/perfil';
  return '/perfil';
};

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = passport.authenticate('google', {
  failureRedirect: '/acesso-candidato',
  successRedirect: '/perfil'
});

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};

exports.candidateAccessPage = async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect(resolveRoleHome(req.user));
  }

  try {
    const resetToken = normalizeOptionalValue(req.query.resetToken);
    let passwordResetResendSeconds = 0;

    if (resetToken) {
      const resetUser = await findPasswordResetUserByToken(resetToken);
      if (resetUser && resetUser.passwordResetLastSentAt) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(resetUser.passwordResetLastSentAt).getTime()) / 1000);
        passwordResetResendSeconds = Math.max(0, PASSWORD_RESET_RESEND_SECONDS - elapsedSeconds);
      }
    }

    res.render('site/candidate-access', {
      title: 'Entrar ou cadastrar',
      accessError: req.query.error || null,
      accessStatus: req.query.status || null,
      accessSection: req.query.section || 'login',
      resetToken,
      passwordResetResendSeconds
    });
  } catch (error) {
    return next(error);
  }
};

exports.candidateRegister = async (req, res, next) => {
  try {
    const name = normalizeOptionalValue(req.body.name);
    const email = normalizeOptionalValue(req.body.email).toLowerCase();
    const cpf = normalizeDocument(req.body.cpf);
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!name || !email || !cpf || !password || !confirmPassword) {
      return res.redirect(buildAccessRedirect('Preencha nome, CPF, e-mail, senha e confirmacao para concluir o cadastro do candidato.', 'register-candidate'));
    }

    if (password.length < 6) {
      return res.redirect(buildAccessRedirect('A senha precisa ter pelo menos 6 caracteres.', 'register-candidate'));
    }

    if (password !== confirmPassword) {
      return res.redirect(buildAccessRedirect('A confirmacao da senha nao confere.', 'register-candidate'));
    }

    const existingByCpf = await User.findOne({ where: { cpf } });
    if (existingByCpf) {
      return res.redirect(buildAccessRedirect('Você já possui um perfil cadastrado em nosso sistema. Faça login para acessar sua conta ou recupere sua senha.', 'login'));
    }

    const existingByEmail = await User.findOne({ where: { email } });
    if (existingByEmail) {
      return res.redirect(buildAccessRedirect('Ja existe uma conta cadastrada com este e-mail.', 'login'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      cpf,
      password: hashedPassword,
      role: 'candidato',
      status: 'ativo',
      providerLogin: 'email'
    });

    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect('/perfil');
    });
  } catch (error) {
    return next(error);
  }
};

exports.companyRegister = async (req, res, next) => {
  try {
    const companyProfileType = normalizeOptionalValue(req.body.companyProfileType);
    const companyDocumentType = normalizeOptionalValue(req.body.companyDocumentType);
    const companyDocument = normalizeDocument(req.body.companyDocument);
    const companyLegalName = normalizeOptionalValue(req.body.companyLegalName);
    const companyTradeName = normalizeOptionalValue(req.body.companyTradeName);
    const companyStateRegistration = normalizeOptionalValue(req.body.companyStateRegistration);
    const companySector = normalizeOptionalValue(req.body.companySector);
    const companyResponsibleName = normalizeOptionalValue(req.body.companyResponsibleName);
    const companyResponsibleCpf = normalizeDocument(req.body.companyResponsibleCpf);
    const companyPhone = normalizeOptionalValue(req.body.companyPhone);
    const email = normalizeOptionalValue(req.body.email).toLowerCase();
    const address = normalizeOptionalValue(req.body.address);
    const city = normalizeOptionalValue(req.body.city);
    const state = normalizeOptionalValue(req.body.state);
    const companyZipCode = normalizeOptionalValue(req.body.companyZipCode);
    const companyWebsite = normalizeOptionalValue(req.body.companyWebsite);
    const companyPrivacyAccepted = req.body.companyPrivacyAccepted === 'on';
    const companyTermsAccepted = req.body.companyTermsAccepted === 'on';
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!companyProfileType || !companyDocumentType || !companyDocument || !companyLegalName || !companyResponsibleName || !email || !companyPhone || !address || !city || !state || !companyZipCode || !password || !confirmPassword) {
      return res.redirect(buildAccessRedirect('Preencha os campos obrigatorios do cadastro da empresa para continuar.', 'register-company'));
    }

    if (password.length < 6) {
      return res.redirect(buildAccessRedirect('A senha da empresa precisa ter pelo menos 6 caracteres.', 'register-company'));
    }

    if (password !== confirmPassword) {
      return res.redirect(buildAccessRedirect('A confirmacao da senha da empresa nao confere.', 'register-company'));
    }

    if (!companyPrivacyAccepted || !companyTermsAccepted) {
      return res.redirect(buildAccessRedirect('Para concluir o cadastro da empresa, aceite a Política de privacidade e os Termos de uso.', 'register-company'));
    }

    const existingByDocument = await User.findOne({
      where: {
        [Op.or]: [
          { companyDocument },
          companyResponsibleCpf ? { companyResponsibleCpf } : null
        ].filter(Boolean)
      }
    });

    if (existingByDocument) {
      return res.redirect(buildAccessRedirect('Já existe um cadastro vinculado a este documento. Faça login para acessar o painel da empresa ou recupere sua senha.', 'login'));
    }

    const existingByEmail = await User.findOne({ where: { email } });
    if (existingByEmail) {
      return res.redirect(buildAccessRedirect('Ja existe uma conta cadastrada com este e-mail.', 'login'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: companyResponsibleName,
      email,
      password: hashedPassword,
      role: 'empresa',
      status: 'pendente',
      providerLogin: 'email',
      address,
      city,
      state,
      companyProfileType,
      companyDocumentType,
      companyDocument,
      companyLegalName,
      companyTradeName,
      companyStateRegistration,
      companySector,
      companyResponsibleName,
      companyResponsibleCpf,
      companyPhone,
      companyCorporateEmail: email,
      companyZipCode,
      companyWebsite,
      companyPrivacyAccepted,
      companyPrivacyAcceptedAt: companyPrivacyAccepted ? new Date() : null,
      companyTermsAccepted,
      companyTermsAcceptedAt: companyTermsAccepted ? new Date() : null
    });

    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect('/perfil?status=' + encodeURIComponent('Cadastro realizado com sucesso. Sua empresa aguarda validacao de pagamento e aprovacao administrativa.'));
    });
  } catch (error) {
    return next(error);
  }
};

exports.candidateLogin = async (req, res, next) => {
  try {
    const identifierRaw = normalizeOptionalValue(req.body.identifier).toLowerCase();
    const identifierDocument = normalizeDocument(req.body.identifier);
    const password = req.body.password || '';

    const where = [];
    if (identifierRaw) {
      where.push({ email: identifierRaw });
    }
    if (identifierDocument) {
      where.push({ cpf: identifierDocument }, { companyDocument: identifierDocument }, { companyResponsibleCpf: identifierDocument });
    }

    const user = await User.findOne({ where: { [Op.or]: where } });
    if (!user) {
      return res.redirect(buildAccessRedirect('CPF, CNPJ, e-mail ou senha inválidos. Verifique os dados e tente novamente.', 'login'));
    }

    if (user.status === 'bloqueado') {
      return res.redirect(buildAccessRedirect('Conta bloqueada. Entre em contato com a equipe.', 'login'));
    }

    if (user.role === 'empresa' && user.status === 'pendente') {
      req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return res.redirect('/perfil?status=' + encodeURIComponent('Sua empresa esta pendente. Aguarde a validacao do pagamento e a aprovacao do administrador.'));
      });
      return;
    }

    const passwordOk = await bcrypt.compare(password, user.password || '');
    if (!passwordOk) {
      return res.redirect(buildAccessRedirect('CPF, CNPJ, e-mail ou senha inválidos. Verifique os dados e tente novamente.', 'login'));
    }

    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect(resolveRoleHome(user));
    });
  } catch (error) {
    return next(error);
  }
};

exports.adminModalLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    const returnTo = req.body.returnTo || '/';

    if (!user) {
      const separator = returnTo.includes('?') ? '&' : '?';
      const message = encodeURIComponent((info && info.message) || 'Dados invalidos');
      return res.redirect(`${returnTo}${separator}adminLoginOpen=1&adminLoginError=${message}`);
    }

    req.logIn(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const identifierRaw = normalizeOptionalValue(req.body.identifier).toLowerCase();
    const resetToken = normalizeOptionalValue(req.body.resetToken);
    let user = null;

    if (resetToken) {
      user = await findPasswordResetUserByToken(resetToken);
      if (!user) {
        return res.redirect(buildAccessResetRedirect('Sua solicitacao expirou. Solicite um novo codigo para continuar.', 'forgot-request', '', 'error'));
      }

      if (user.passwordResetLastSentAt) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(user.passwordResetLastSentAt).getTime()) / 1000);
        if (elapsedSeconds < PASSWORD_RESET_RESEND_SECONDS) {
          return res.redirect(buildAccessResetRedirect(`Aguarde ${PASSWORD_RESET_RESEND_SECONDS - elapsedSeconds} segundos para reenviar o codigo.`, 'forgot-verify', resetToken, 'error'));
        }
      }
    } else {
      const identifierDocument = normalizeDocument(req.body.identifier);
      const where = [];
      if (identifierRaw) {
        where.push({ email: identifierRaw });
      }
      if (identifierDocument) {
        where.push({ cpf: identifierDocument }, { companyDocument: identifierDocument }, { companyResponsibleCpf: identifierDocument });
      }

      if (!where.length) {
        return res.redirect(buildAccessResetRedirect('Informe CPF, CNPJ ou e-mail cadastrado para continuar.', 'forgot-request', '', 'error'));
      }

      user = await User.findOne({ where: { [Op.or]: where } });
      if (!user) {
        return res.redirect(buildAccessResetRedirect('Não encontramos um cadastro com essas informações.', 'forgot-request', '', 'error'));
      }
    }

    const code = generateVerificationCode();
    const nextResetToken = resetToken || generateResetToken();

    await user.update({
      passwordResetTokenHash: hashValue(nextResetToken),
      passwordResetCodeHash: hashValue(code),
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000),
      passwordResetAttemptCount: 0,
      passwordResetLastSentAt: new Date(),
      passwordResetVerifiedAt: null
    });

    try {
      await sendPasswordResetCode(user, code);
    } catch (mailError) {
      console.error('Falha ao enviar e-mail de recuperacao:', mailError.message);
      const isSmtpConfigError = String(mailError.message || '').toLowerCase().includes('nao configurado')
        || String(mailError.message || '').includes('SMTP_');
      const message = isSmtpConfigError
        ? 'O servico de e-mail da plataforma ainda nao foi configurado. Preencha o SMTP em Configuracoes do administrador para liberar a recuperacao por e-mail.'
        : 'Nao foi possivel enviar o codigo de verificacao no momento. Tente novamente em alguns minutos.';
      return res.redirect(buildAccessResetRedirect(message, 'forgot-request', '', 'error'));
    }

    return res.redirect(buildAccessResetRedirect('Enviamos um codigo de verificacao para seu e-mail. Digite o codigo para continuar.', 'forgot-verify', nextResetToken));
  } catch (error) {
    return next(error);
  }
};

exports.verifyPasswordResetCode = async (req, res, next) => {
  try {
    const resetToken = normalizeOptionalValue(req.body.resetToken);
    const code = normalizeDocument(req.body.code);
    const user = await findPasswordResetUserByToken(resetToken);

    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      return res.redirect(buildAccessResetRedirect('Sua solicitacao expirou. Solicite um novo codigo para continuar.', 'forgot-request', '', 'error'));
    }

    if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      await resetPasswordRecoveryState(user);
      return res.redirect(buildAccessResetRedirect('O codigo expirou. Solicite um novo codigo para continuar.', 'forgot-request', '', 'error'));
    }

    if (user.passwordResetAttemptCount >= PASSWORD_RESET_MAX_ATTEMPTS) {
      await resetPasswordRecoveryState(user);
      return res.redirect(buildAccessResetRedirect('Voce excedeu o limite de tentativas. Solicite um novo codigo.', 'forgot-request', '', 'error'));
    }

    if (!code || hashValue(code) !== user.passwordResetCodeHash) {
      await user.update({ passwordResetAttemptCount: (user.passwordResetAttemptCount || 0) + 1 });
      return res.redirect(buildAccessResetRedirect('Codigo invalido. Verifique o codigo recebido no e-mail e tente novamente.', 'forgot-verify', resetToken, 'error'));
    }

    await user.update({ passwordResetVerifiedAt: new Date() });
    return res.redirect(buildAccessResetRedirect('Código validado com sucesso. Agora crie sua nova senha.', 'forgot-reset', resetToken));
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetToken = normalizeOptionalValue(req.body.resetToken);
    const newPassword = req.body.newPassword || '';
    const confirmPassword = req.body.confirmPassword || '';
    const user = await findPasswordResetUserByToken(resetToken);

    if (!user || !user.passwordResetVerifiedAt || !user.passwordResetExpiresAt) {
      return res.redirect(buildAccessResetRedirect('Sua solicitacao de recuperacao nao e mais valida. Solicite um novo codigo.', 'forgot-request', '', 'error'));
    }

    if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      await resetPasswordRecoveryState(user);
      return res.redirect(buildAccessResetRedirect('O prazo para redefinir a senha expirou. Solicite um novo codigo.', 'forgot-request', '', 'error'));
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.redirect(buildAccessResetRedirect('A nova senha deve ter no minimo 8 caracteres, com pelo menos 1 letra e 1 numero.', 'forgot-reset', resetToken, 'error'));
    }

    if (newPassword !== confirmPassword) {
      return res.redirect(buildAccessResetRedirect('A confirmacao da nova senha nao confere.', 'forgot-reset', resetToken, 'error'));
    }

    await user.update({
      password: await bcrypt.hash(newPassword, 10)
    });

    await resetPasswordRecoveryState(user);
    return res.redirect(buildAccessStatusRedirect('Sua senha foi alterada com sucesso. Agora você pode acessar sua conta.', 'login'));
  } catch (error) {
    return next(error);
  }
};

exports.checkDocumentAvailability = async (req, res, next) => {
  try {
    const profile = normalizeOptionalValue(req.query.profile).toLowerCase();
    const document = normalizeDocument(req.query.document);

    if (!document) {
      return res.json({ exists: false, message: '' });
    }

    if (profile === 'candidato') {
      const existingUser = await User.findOne({ where: { cpf: document } });
      if (existingUser) {
        return res.json({
          exists: true,
          message: 'Você já possui um perfil cadastrado em nosso sistema. Faça login para acessar sua conta ou recupere sua senha.'
        });
      }
      return res.json({ exists: false, message: 'CPF disponivel para cadastro.' });
    }

    if (profile === 'empresa') {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { companyDocument: document },
            { companyResponsibleCpf: document }
          ]
        }
      });
      if (existingUser) {
        return res.json({
          exists: true,
          message: 'Já existe um cadastro vinculado a este documento. Faça login para acessar o painel da empresa ou recupere sua senha.'
        });
      }
      return res.json({ exists: false, message: 'Documento disponivel para cadastro.' });
    }

    return res.json({ exists: false, message: '' });
  } catch (error) {
    return next(error);
  }
};
