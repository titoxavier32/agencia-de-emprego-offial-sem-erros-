const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../../config/database');
const Job = require('../../models/Job');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Menu = require('../../models/Menu');
const Setting = require('../../models/Setting');
const ContactMessage = require('../../models/ContactMessage');
const PublicSelection = require('../../models/PublicSelection');
const JobApplication = require('../../models/JobApplication');
const VisitorLog = require('../../models/VisitorLog');
const SatisfactionSurvey = require('../../models/SatisfactionSurvey');
const { buildPaymentSummary, buildSiteStructureMeta } = require('./helpers');

const APPLICATION_STATUS_OPTIONS = ['recebida', 'em_analise', 'entrevista', 'aprovada', 'reprovada', 'banco_de_talentos'];

exports.loginPage = (req, res) => {
  if (req.isAuthenticated() && req.user.role === 'admin') return res.redirect('/admin/dashboard');
  return res.render('admin/login', { title: 'Login Admin', error: req.query.error });
};
exports.dashboard = async (req, res) => {
  const [
    jobCount, courseCount, publicSelectionCount, userCount, 
    companyManagerCount, candidateCount, adminCount, 
    contactCount, applicationCount, recentContacts, allContacts,
    visitCount, surveyCount, recentSurveys
  ] = await Promise.all([
    Job.count(),
    Course.count(),
    PublicSelection.count(),
    User.count(),
    User.count({ where: { role: 'empresa' } }),
    User.count({ where: { role: { [Op.in]: ['candidato', 'user'] } } }),
    User.count({ where: { role: 'admin' } }),
    ContactMessage.count(),
    JobApplication.count(),
    ContactMessage.findAll({ order: [['createdAt', 'DESC']], limit: 5 }),
    ContactMessage.findAll({ order: [['createdAt', 'DESC']] }),
    VisitorLog.count(),
    SatisfactionSurvey.count(),
    SatisfactionSurvey.findAll({ order: [['createdAt', 'DESC']], limit: 5 })
  ]);

  // Dados para Gráfico de Visitas (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyVisits = await VisitorLog.findAll({
    attributes: [
      [sequelize.fn('date', sequelize.col('createdAt')), 'day'],
      [sequelize.fn('count', sequelize.col('id')), 'count']
    ],
    where: { createdAt: { [Op.gte]: sevenDaysAgo } },
    group: [sequelize.fn('date', sequelize.col('createdAt'))],
    order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']],
    raw: true
  });

  // Dados para Gráfico de Satisfação (pizza)
  const surveyStats = await SatisfactionSurvey.findAll({
    attributes: [
      'rating',
      [sequelize.fn('count', sequelize.col('id')), 'count']
    ],
    group: ['rating'],
    raw: true
  });

  const ratingLabels = ['1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas'];
  const ratingData = [0, 0, 0, 0, 0];
  surveyStats.forEach(stat => {
    if (stat.rating >= 1 && stat.rating <= 5) {
      ratingData[stat.rating - 1] = parseInt(stat.count, 10);
    }
  });

  return res.render('admin/dashboard', {
    title: 'Dashboard de Inteligência',
    jobCount,
    courseCount,
    publicSelectionCount,
    userCount,
    companyManagerCount,
    candidateCount,
    adminCount,
    contactCount,
    applicationCount,
    recentContacts,
    visitCount,
    surveyCount,
    recentSurveys,
    dailyVisits,
    surveyChartData: {
      labels: ratingLabels,
      data: ratingData
    },
    paymentSummary: buildPaymentSummary(allContacts),
    user: req.user
  });
};

exports.listApplications = async (req, res) => {
  const applications = await JobApplication.findAll({ order: [['createdAt', 'DESC']] });
  const jobIds = [...new Set(applications.map((application) => application.jobId).filter(Boolean))];
  const candidateIds = [...new Set(applications.map((application) => application.candidateUserId).filter(Boolean))];
  const companyIds = [...new Set(applications.map((application) => application.companyUserId).filter(Boolean))];
  const [jobs, candidates, companies] = await Promise.all([
    jobIds.length ? Job.findAll({ where: { id: { [Op.in]: jobIds } } }) : [],
    candidateIds.length ? User.findAll({ where: { id: { [Op.in]: candidateIds } } }) : [],
    companyIds.length ? User.findAll({ where: { id: { [Op.in]: companyIds } } }) : []
  ]);
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const normalizedApplications = applications.map((application) => ({
    ...application.get({ plain: true }),
    job: jobsById.get(application.jobId) || null,
    candidate: candidatesById.get(application.candidateUserId) || null,
    company: companiesById.get(application.companyUserId) || null
  }));
  return res.render('admin/candidaturas/list', {
    title: 'Gerenciar Candidaturas',
    applications: normalizedApplications,
    applicationStatusOptions: APPLICATION_STATUS_OPTIONS,
    statusMessage: req.query.status || null,
    errorMessage: req.query.error || null,
    user: req.user
  });
};

exports.updateApplicationStatus = async (req, res) => {
  const application = await JobApplication.findByPk(req.params.id);
  if (!application) return res.redirect('/admin/candidaturas?error=' + encodeURIComponent('Candidatura nao encontrada.'));
  const nextStatus = APPLICATION_STATUS_OPTIONS.includes(req.body.status) ? req.body.status : 'recebida';
  await application.update({ status: nextStatus });
  return res.redirect('/admin/candidaturas?status=' + encodeURIComponent('Status da candidatura atualizado com sucesso.'));
};

exports.deleteApplication = async (req, res) => {
  const application = await JobApplication.findByPk(req.params.id);
  if (!application) return res.redirect('/admin/candidaturas?error=' + encodeURIComponent('Candidatura nao encontrada.'));
  await application.destroy();
  return res.redirect('/admin/candidaturas?status=' + encodeURIComponent('Candidatura excluida com sucesso.'));
};

exports.siteStructure = async (req, res) => {
  const [setting, menus, companyCount, jobCount, courseCount, selectionCount, contactCount] = await Promise.all([
    Setting.findOne(),
    Menu.findAll({ where: { isActive: true }, order: [['order', 'ASC'], ['id', 'ASC']] }),
    User.count({ where: { role: 'empresa' } }),
    Job.count(),
    Course.count(),
    PublicSelection.count(),
    ContactMessage.count()
  ]);
  const homeSectionMeta = buildSiteStructureMeta();
  const orderedHomeKeys = String(setting && setting.homeSectionOrder ? setting.homeSectionOrder : '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => homeSectionMeta[item]);
  const homeSections = (orderedHomeKeys.length ? orderedHomeKeys : Object.keys(homeSectionMeta)).map((key, index) => ({ key, order: index + 1, ...homeSectionMeta[key] }));
  const flowNodes = [
    { title: 'Entrada publica', description: 'O visitante chega pela home e encontra logo o posicionamento central do portal.', tags: ['Top ads', 'Hero', 'Menu principal'] },
    { title: 'Exploracao de conteudo', description: 'A pessoa segue para vagas, cursos, selecoes publicas ou empresas parceiras.', tags: ['Vagas', 'Cursos', 'Selecoes'] },
    { title: 'Acao e contato', description: 'Na etapa seguinte, o usuario envia mensagem, se candidata ou inicia um cadastro.', tags: ['Contato', 'Candidatura', 'Conversao'] },
    { title: 'Gestao administrativa', description: 'A equipe acompanha tudo pelo painel com menus, usuarios, empresas e configuracoes.', tags: ['Dashboard', 'Menus', 'Configuracoes'] }
  ];
  const flowChart = [
    { label: 'Descoberta', value: 100, note: 'Home, banners e hero puxam o olhar para o que importa primeiro.' },
    { label: 'Navegacao', value: 82, note: 'Vagas, cursos, selecoes e empresas organizam a busca do usuario.' },
    { label: 'Conversao', value: 66, note: 'Contato, candidatura e chamadas diretas reduzem atrito.' },
    { label: 'Gestao', value: 48, note: 'O admin concentra operacao, publicacao e manutencao visual.' }
  ];
  const summaryCards = [
    { label: 'Secoes da home', value: homeSections.length, note: 'Ordem editorial do portal' },
    { label: 'Menus ativos', value: menus.length, note: 'Navegacao publica configurada' },
    { label: 'Empresas', value: companyCount, note: 'Gestao de parceiros e contas' },
    { label: 'Conteudos principais', value: jobCount + courseCount + selectionCount, note: 'Vagas, cursos e selecoes publicas' },
    { label: 'Mensagens', value: contactCount, note: 'Fluxo de atendimento e conversao' }
  ];
  return res.render('admin/estrutura-site', {
    title: 'Estrutura do site',
    user: req.user,
    setting: setting ? setting.get({ plain: true }) : null,
    menus: menus.map((menu) => menu.get({ plain: true })),
    homeSections,
    flowNodes,
    flowChart,
    summaryCards
  });
};
