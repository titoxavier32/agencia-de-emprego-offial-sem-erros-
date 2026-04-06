const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { buildCompanyShowcaseStatus, normalizeOptionalValue } = require('./helpers');

exports.listUsers = async (req, res) => {
  const users = await User.findAll({ order: [['role', 'ASC'], ['createdAt', 'DESC']] });
  return res.render('admin/usuarios', {
    title: 'Gestao de usuarios',
    users,
    user: req.user,
    formError: req.query.error || null,
    formStatus: req.query.status || null
  });
};

exports.listCompanies = async (req, res) => {
  const companies = await User.findAll({
    where: { role: 'empresa' },
    order: [['companyShowcaseOrder', 'ASC'], ['createdAt', 'DESC']]
  });

  return res.render('admin/empresas', {
    title: 'Gestao de empresas',
    companies: companies.map((company) => ({
      ...company.get({ plain: true }),
      showcaseStatus: buildCompanyShowcaseStatus(company)
    })),
    user: req.user,
    formStatus: req.query.status || null
  });
};

exports.editCompanyForm = async (req, res) => {
  const company = await User.findOne({ where: { id: req.params.id, role: 'empresa' } });
  if (!company) return res.redirect('/admin/empresas');

  return res.render('admin/empresas/form', {
    title: 'Editar empresa',
    company,
    companyShowcaseStatus: buildCompanyShowcaseStatus(company),
    user: req.user,
    formError: req.query.error || null,
    formStatus: req.query.status || null
  });
};

exports.updateCompany = async (req, res) => {
  const company = await User.findOne({ where: { id: req.params.id, role: 'empresa' } });
  if (!company) return res.redirect('/admin/empresas');

  const email = normalizeOptionalValue(req.body.email).toLowerCase();
  if (!email || !normalizeOptionalValue(req.body.companyLegalName) || !normalizeOptionalValue(req.body.companyResponsibleName)) {
    return res.redirect('/admin/empresas/editar/' + req.params.id + '?error=' + encodeURIComponent('Preencha os campos principais da empresa para continuar.'));
  }

  const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: company.id } } });
  if (existingUser) {
    return res.redirect('/admin/empresas/editar/' + req.params.id + '?error=' + encodeURIComponent('Ja existe outra conta usando este e-mail.'));
  }

  await company.update({
    name: normalizeOptionalValue(req.body.companyResponsibleName) || company.name,
    email,
    status: ['ativo', 'pendente', 'bloqueado'].includes(req.body.status) ? req.body.status : 'ativo',
    address: normalizeOptionalValue(req.body.address),
    city: normalizeOptionalValue(req.body.city),
    state: normalizeOptionalValue(req.body.state),
    companyProfileType: normalizeOptionalValue(req.body.companyProfileType),
    companyDocumentType: normalizeOptionalValue(req.body.companyDocumentType),
    companyDocument: normalizeOptionalValue(req.body.companyDocument).replace(/\D/g, ''),
    companyLegalName: normalizeOptionalValue(req.body.companyLegalName),
    companyTradeName: normalizeOptionalValue(req.body.companyTradeName),
    companyStateRegistration: normalizeOptionalValue(req.body.companyStateRegistration),
    companySector: normalizeOptionalValue(req.body.companySector),
    companyResponsibleName: normalizeOptionalValue(req.body.companyResponsibleName),
    companyResponsibleCpf: normalizeOptionalValue(req.body.companyResponsibleCpf).replace(/\D/g, ''),
    companyPhone: normalizeOptionalValue(req.body.companyPhone),
    companyCorporateEmail: email,
    companyZipCode: normalizeOptionalValue(req.body.companyZipCode),
    companyWebsite: normalizeOptionalValue(req.body.companyWebsite),
    companyShowcaseEnabled: req.body.companyShowcaseEnabled === 'on',
    companyShowcaseLgpdConsent: req.body.companyShowcaseLgpdConsent === 'on',
    companyPublicDisplayName: normalizeOptionalValue(req.body.companyPublicDisplayName),
    companyPublicSummary: normalizeOptionalValue(req.body.companyPublicSummary),
    companyShowcaseOrder: parseInt(req.body.companyShowcaseOrder, 10) || 0,
    companyPaymentValidated: req.body.companyPaymentValidated === 'on',
    companyPaymentValidatedAt: req.body.companyPaymentValidated === 'on' ? (company.companyPaymentValidatedAt || new Date()) : null,
    companyApprovedAt: req.body.status === 'ativo' ? (company.companyApprovedAt || new Date()) : null,
    companyApprovedBy: req.body.status === 'ativo' ? (req.user ? req.user.id : null) : null,
    companyApprovalNotes: normalizeOptionalValue(req.body.companyApprovalNotes),
    ...(req.file ? { avatar: '/uploads/' + req.file.filename } : {})
  });

  return res.redirect('/admin/empresas/editar/' + req.params.id + '?status=' + encodeURIComponent('Empresa atualizada com sucesso.'));
};

exports.approveCompany = async (req, res) => {
  const company = await User.findOne({ where: { id: req.params.id, role: 'empresa' } });
  if (!company) return res.redirect('/admin/empresas');

  await company.update({
    status: 'ativo',
    companyPaymentValidated: true,
    companyPaymentValidatedAt: company.companyPaymentValidatedAt || new Date(),
    companyApprovedAt: new Date(),
    companyApprovedBy: req.user ? req.user.id : null
  });

  return res.redirect('/admin/empresas?status=' + encodeURIComponent('Empresa aprovada com sucesso.'));
};

exports.blockCompany = async (req, res) => {
  const company = await User.findOne({ where: { id: req.params.id, role: 'empresa' } });
  if (!company) return res.redirect('/admin/empresas');

  await company.update({ status: 'bloqueado' });
  return res.redirect('/admin/empresas?status=' + encodeURIComponent('Empresa bloqueada com sucesso.'));
};

exports.createUser = async (req, res) => {
  const name = normalizeOptionalValue(req.body.name);
  const email = normalizeOptionalValue(req.body.email).toLowerCase();
  const password = req.body.password || '';
  const allowedRoles = new Set(['admin', 'empresa', 'candidato']);
  const role = allowedRoles.has(req.body.role) ? req.body.role : 'candidato';
  const status = req.body.status === 'bloqueado' ? 'bloqueado' : (req.body.status === 'pendente' ? 'pendente' : 'ativo');

  if (!name || !email || !password) {
    return res.redirect('/admin/usuarios?error=' + encodeURIComponent('Nome, e-mail e senha sao obrigatorios.'));
  }

  if (password.length < 6) {
    return res.redirect('/admin/usuarios?error=' + encodeURIComponent('A senha precisa ter pelo menos 6 caracteres.'));
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.redirect('/admin/usuarios?error=' + encodeURIComponent('Ja existe um usuario cadastrado com esse e-mail.'));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    status,
    providerLogin: 'email'
  });

  return res.redirect('/admin/usuarios?status=' + encodeURIComponent('Usuario cadastrado com sucesso.'));
};
