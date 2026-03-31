const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const normalizeOptionalValue = (value) => value ? String(value).trim() : '';
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const normalizeCourseHistory = (body) => {
  const degreeLevels = ensureArray(body.courseDegreeLevel);
  const courseNames = ensureArray(body.courseName);
  const startDates = ensureArray(body.courseStartDate);
  const endDates = ensureArray(body.courseEndDate);
  const currentFlags = new Set(ensureArray(body.courseCurrent));
  const institutions = ensureArray(body.courseInstitution);

  return courseNames.map((courseName, index) => ({
    degreeLevel: normalizeOptionalValue(degreeLevels[index]),
    courseName: normalizeOptionalValue(courseName),
    startDate: normalizeOptionalValue(startDates[index]),
    endDate: normalizeOptionalValue(endDates[index]),
    isCurrent: currentFlags.has(String(index)),
    institution: normalizeOptionalValue(institutions[index])
  })).filter((item) => Object.values(item).some((value) => value === true || Boolean(value)));
};

const normalizeExperienceHistory = (body) => {
  const startDates = ensureArray(body.experienceStartDate);
  const endDates = ensureArray(body.experienceEndDate);
  const companyNames = ensureArray(body.experienceCompanyName);
  const roles = ensureArray(body.experienceRole);
  const descriptions = ensureArray(body.experienceDescription);

  return companyNames.map((companyName, index) => ({
    startDate: normalizeOptionalValue(startDates[index]),
    endDate: normalizeOptionalValue(endDates[index]),
    companyName: normalizeOptionalValue(companyName),
    role: normalizeOptionalValue(roles[index]),
    description: normalizeOptionalValue(descriptions[index])
  })).filter((item) => Object.values(item).some(Boolean));
};

const parseStoredCollection = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

exports.perfil = async (req, res) => {
  if (req.user.role === 'empresa') {
    const companyJobs = await Job.findAll({
      where: { companyUserId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    return res.render('user/company-profile', {
      title: 'Painel da Empresa',
      profileStatus: req.query.status || null,
      profileError: req.query.error || null,
      companyJobs
    });
  }

  const recentApplications = await JobApplication.findAll({
    where: { candidateUserId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  const appliedJobIds = recentApplications.map((item) => item.jobId);
  const appliedJobs = appliedJobIds.length > 0
    ? await Job.findAll({ where: { id: { [Op.in]: appliedJobIds } } })
    : [];
  const appliedJobsMap = new Map(appliedJobs.map((job) => [job.id, job]));

  res.render('user/perfil', {
    title: 'Meu Perfil',
    profileStatus: req.query.status || null,
    profileError: req.query.error || null,
    courseHistory: parseStoredCollection(req.user.courseHistory),
    experienceHistory: parseStoredCollection(req.user.experienceHistory),
    recentApplications: recentApplications.map((application) => ({
      ...application.get({ plain: true }),
      job: appliedJobsMap.get(application.jobId) || null
    }))
  });
};

exports.updatePerfil = async (req, res) => {
  try {
    if (req.user.role === 'empresa') {
      const email = normalizeOptionalValue(req.body.email).toLowerCase();
      const companyDocument = normalizeOptionalValue(req.body.companyDocument).replace(/\D/g, '');
      const companyResponsibleCpf = normalizeOptionalValue(req.body.companyResponsibleCpf).replace(/\D/g, '');

      if (!normalizeOptionalValue(req.body.companyProfileType) || !normalizeOptionalValue(req.body.companyDocumentType) || !companyDocument || !normalizeOptionalValue(req.body.companyLegalName) || !normalizeOptionalValue(req.body.companyResponsibleName) || !normalizeOptionalValue(req.body.companyPhone) || !email || !normalizeOptionalValue(req.body.address) || !normalizeOptionalValue(req.body.city) || !normalizeOptionalValue(req.body.state) || !normalizeOptionalValue(req.body.companyZipCode)) {
        return res.redirect('/perfil?error=' + encodeURIComponent('Preencha os campos obrigatórios da empresa para continuar.'));
      }

      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: req.user.id }
        }
      });
      if (existingUser) {
        return res.redirect('/perfil?error=' + encodeURIComponent('Este e-mail ja esta em uso por outra conta.'));
      }

      const duplicateDocument = await User.findOne({
        where: {
          id: { [Op.ne]: req.user.id },
          [Op.or]: [
            { companyDocument },
            companyResponsibleCpf ? { companyResponsibleCpf } : null
          ].filter(Boolean)
        }
      });

      if (duplicateDocument) {
        return res.redirect('/perfil?error=' + encodeURIComponent('Ja existe um cadastro vinculado a este documento.'));
      }

      await req.user.update({
        name: normalizeOptionalValue(req.body.companyResponsibleName) || req.user.name,
        email,
        address: normalizeOptionalValue(req.body.address),
        city: normalizeOptionalValue(req.body.city),
        state: normalizeOptionalValue(req.body.state),
        companyProfileType: normalizeOptionalValue(req.body.companyProfileType),
        companyDocumentType: normalizeOptionalValue(req.body.companyDocumentType),
        companyDocument,
        companyLegalName: normalizeOptionalValue(req.body.companyLegalName),
        companyTradeName: normalizeOptionalValue(req.body.companyTradeName),
        companyStateRegistration: normalizeOptionalValue(req.body.companyStateRegistration),
        companySector: normalizeOptionalValue(req.body.companySector),
        companyResponsibleName: normalizeOptionalValue(req.body.companyResponsibleName),
        companyResponsibleCpf,
        companyPhone: normalizeOptionalValue(req.body.companyPhone),
        companyCorporateEmail: email,
        companyZipCode: normalizeOptionalValue(req.body.companyZipCode),
        companyWebsite: normalizeOptionalValue(req.body.companyWebsite),
        companyShowcaseLgpdConsent: req.body.companyShowcaseLgpdConsent === 'on',
        companyPublicDisplayName: normalizeOptionalValue(req.body.companyPublicDisplayName),
        companyPublicSummary: normalizeOptionalValue(req.body.companyPublicSummary),
        ...(req.files && req.files.companyLogo && req.files.companyLogo[0] ? { avatar: '/uploads/companies/' + req.files.companyLogo[0].filename } : {})
      });

      return res.redirect('/perfil?status=' + encodeURIComponent('Dados da empresa atualizados com sucesso.'));
    }
    const email = normalizeOptionalValue(req.body.email).toLowerCase();
    const candidateName = normalizeOptionalValue(req.body.name);
    const cpf = normalizeOptionalValue(req.body.cpf).replace(/\D/g, '');

    if (!candidateName || !email) {
      return res.redirect('/perfil?error=' + encodeURIComponent('Informe pelo menos nome e e-mail para salvar o perfil.'));
    }

    const existingUser = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      return res.redirect('/perfil?error=' + encodeURIComponent('Este e-mail ja esta em uso por outra conta.'));
    }

    if (cpf) {
      const existingCpf = await User.findOne({
        where: {
          cpf,
          id: { [Op.ne]: req.user.id }
        }
      });

      if (existingCpf) {
        return res.redirect('/perfil?error=' + encodeURIComponent('Já existe outro cadastro usando este CPF.'));
      }
    }

    const newPassword = normalizeOptionalValue(req.body.newPassword);
    const confirmPassword = normalizeOptionalValue(req.body.confirmPassword);
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        return res.redirect('/perfil?error=' + encodeURIComponent('A nova senha precisa ter pelo menos 6 caracteres.'));
      }
      if (newPassword !== confirmPassword) {
        return res.redirect('/perfil?error=' + encodeURIComponent('A confirmação da senha não confere.'));
      }
    }

    const updateData = {
      name: candidateName || req.user.name,
      email,
      sex: normalizeOptionalValue(req.body.sex),
      maritalStatus: normalizeOptionalValue(req.body.maritalStatus),
      cpf,
      birthDate: normalizeOptionalValue(req.body.birthDate) || null,
      currentlyEmployed: normalizeOptionalValue(req.body.currentlyEmployed),
      disability: normalizeOptionalValue(req.body.disability),
      hasDriverLicense: req.body.hasDriverLicense === 'sim',
      driverLicenseCategory: normalizeOptionalValue(req.body.driverLicenseCategory),
      phone: normalizeOptionalValue(req.body.phone),
      homePhone: normalizeOptionalValue(req.body.homePhone),
      commercialPhone: normalizeOptionalValue(req.body.commercialPhone),
      commercialPhoneExtension: normalizeOptionalValue(req.body.commercialPhoneExtension),
      mobilePhone: normalizeOptionalValue(req.body.mobilePhone),
      whatsapp: normalizeOptionalValue(req.body.whatsapp || req.body.mobilePhone),
      personalWebsite: normalizeOptionalValue(req.body.personalWebsite),
      address: normalizeOptionalValue(req.body.address),
      addressNumber: normalizeOptionalValue(req.body.addressNumber),
      addressComplement: normalizeOptionalValue(req.body.addressComplement),
      neighborhood: normalizeOptionalValue(req.body.neighborhood),
      zipCode: normalizeOptionalValue(req.body.zipCode),
      state: normalizeOptionalValue(req.body.state),
      city: normalizeOptionalValue(req.body.city),
      country: normalizeOptionalValue(req.body.country) || 'Brasil',
      objective: normalizeOptionalValue(req.body.objective),
      desiredWorkCities: normalizeOptionalValue(req.body.desiredWorkCities),
      intendedArea: normalizeOptionalValue(req.body.intendedArea),
      hierarchyLevel: normalizeOptionalValue(req.body.hierarchyLevel),
      desiredRole: normalizeOptionalValue(req.body.desiredRole),
      salaryExpectation: normalizeOptionalValue(req.body.salaryExpectation),
      englishLevel: null,
      spanishLevel: null,
      otherLanguage1Name: null,
      otherLanguage1Level: null,
      otherLanguage2Name: null,
      otherLanguage2Level: null,
      otherLanguage3Name: null,
      otherLanguage3Level: null,
      miniResume: null,
      courseHistory: JSON.stringify(normalizeCourseHistory(req.body)),
      experienceHistory: JSON.stringify(normalizeExperienceHistory(req.body)),
      portalReferral: normalizeOptionalValue(req.body.portalReferral),
      linkedinUrl: normalizeOptionalValue(req.body.linkedinUrl)
    };

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (req.files && req.files.resumePdf && req.files.resumePdf[0]) {
      updateData.resumePdf = 'candidates/' + req.files.resumePdf[0].filename;
    }

    await req.user.update(updateData);
    return res.redirect('/perfil?status=' + encodeURIComponent('Currículo atualizado com sucesso.'));
  } catch (error) {
    console.error(error);
    return res.redirect('/perfil?error=' + encodeURIComponent('Não foi possível atualizar seus dados.'));
  }
};

const normalizeJobPayload = (body, companyUser, imageFile) => ({
  title: normalizeOptionalValue(body.title),
  description: normalizeOptionalValue(body.description),
  requirements: normalizeOptionalValue(body.requirements),
  benefits: normalizeOptionalValue(body.benefits),
  link: normalizeOptionalValue(body.link),
  image: imageFile ? imageFile.filename : undefined,
  startDate: normalizeOptionalValue(body.startDate) || null,
  endDate: normalizeOptionalValue(body.endDate) || null,
  vacancies: Math.max(parseInt(body.vacancies, 10) || 1, 1),
  salary: normalizeOptionalValue(body.salary),
  employmentType: normalizeOptionalValue(body.employmentType),
  workplaceMode: normalizeOptionalValue(body.workplaceMode),
  location: normalizeOptionalValue(body.location),
  status: normalizeOptionalValue(body.status) || 'ativa',
  companyUserId: companyUser.id,
  companyName: companyUser.companyTradeName || companyUser.companyLegalName || companyUser.name
});

exports.companyJobs = async (req, res) => {
  const jobs = await Job.findAll({
    where: { companyUserId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  const jobIds = jobs.map((job) => job.id);
  const applicationCounts = jobIds.length > 0
    ? await JobApplication.findAll({ where: { jobId: { [Op.in]: jobIds } } })
    : [];
  const applicationCountMap = applicationCounts.reduce((accumulator, application) => {
    accumulator[application.jobId] = (accumulator[application.jobId] || 0) + 1;
    return accumulator;
  }, {});

  res.render('user/company-jobs', {
    title: 'Minhas vagas',
    jobs,
    applicationCountMap,
    companyName: req.user.companyTradeName || req.user.companyLegalName || req.user.name,
    profileStatus: req.query.status || null,
    profileError: req.query.error || null
  });
};

exports.companyJobForm = async (req, res) => {
  const job = req.params.id
    ? await Job.findOne({ where: { id: req.params.id, companyUserId: req.user.id } })
    : null;

  if (req.params.id && !job) {
    return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Vaga não encontrada.'));
  }

  return res.render('user/company-job-form', {
    title: job ? 'Editar vaga' : 'Nova vaga',
    job,
    formError: req.query.error || null
  });
};

exports.saveCompanyJob = async (req, res) => {
  try {
    const payload = normalizeJobPayload(req.body, req.user, req.file);

    if (!payload.title || !payload.description || !payload.location) {
      const target = req.params.id ? `/perfil/empresa/vagas/${req.params.id}/editar` : '/perfil/empresa/vagas/nova';
      return res.redirect(target + '?error=' + encodeURIComponent('Preencha título, descrição e local da vaga.'));
    }

    if (req.params.id) {
      const job = await Job.findOne({ where: { id: req.params.id, companyUserId: req.user.id } });
      if (!job) {
        return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Vaga não encontrada.'));
      }

      if (!req.file) delete payload.image;
      await job.update(payload);
      return res.redirect('/perfil/empresa/vagas?status=' + encodeURIComponent('Vaga atualizada com sucesso.'));
    }

    await Job.create(payload);
    return res.redirect('/perfil/empresa/vagas?status=' + encodeURIComponent('Vaga publicada com sucesso.'));
  } catch (error) {
    console.error(error);
    return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Não foi possível salvar a vaga.'));
  }
};

exports.deleteCompanyJob = async (req, res) => {
  await Job.destroy({ where: { id: req.params.id, companyUserId: req.user.id } });
  return res.redirect('/perfil/empresa/vagas?status=' + encodeURIComponent('Vaga removida com sucesso.'));
};

exports.companyJobApplications = async (req, res) => {
  const job = await Job.findOne({ where: { id: req.params.id, companyUserId: req.user.id } });
  if (!job) {
    return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Vaga nao encontrada.'));
  }

  const applications = await JobApplication.findAll({
    where: { jobId: job.id },
    order: [['createdAt', 'DESC']]
  });

  const candidateIds = applications.map((application) => application.candidateUserId);
  const candidates = candidateIds.length > 0
    ? await User.findAll({ where: { id: { [Op.in]: candidateIds } } })
    : [];
  const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  return res.render('user/company-job-applications', {
    title: 'Candidatos da vaga',
    job,
    profileStatus: req.query.status || null,
    profileError: req.query.error || null,
    applications: applications.map((application) => ({
      ...application.get({ plain: true }),
      candidate: candidateMap.get(application.candidateUserId) || null
    }))
  });
};

exports.updateApplicationStatus = async (req, res) => {
  const application = await JobApplication.findByPk(req.params.applicationId);
  if (!application) {
    return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Candidatura não encontrada.'));
  }

  const job = await Job.findOne({ where: { id: application.jobId, companyUserId: req.user.id } });
  if (!job) {
    return res.redirect('/perfil/empresa/vagas?error=' + encodeURIComponent('Você não tem permissão para alterar esta candidatura.'));
  }

  await application.update({
    status: normalizeOptionalValue(req.body.status) || 'recebida'
  });

  return res.redirect(`/perfil/empresa/vagas/${job.id}/candidatos?status=${encodeURIComponent('Status da candidatura atualizado com sucesso.')}`);
};

exports.applyForJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job || job.status === 'encerrada') {
      return res.redirect('/vagas?error=' + encodeURIComponent('Esta vaga não está disponível para candidatura.'));
    }

    if (req.user.role !== 'candidato' && req.user.role !== 'user') {
      return res.redirect('/perfil?error=' + encodeURIComponent('Apenas candidatos podem se candidatar as vagas.'));
    }

    const alreadyApplied = await JobApplication.findOne({
      where: {
        jobId: job.id,
        candidateUserId: req.user.id
      }
    });

    if (alreadyApplied) {
      return res.redirect('/vagas?status=' + encodeURIComponent('Você já se candidatou a esta vaga.'));
    }

    await JobApplication.create({
      jobId: job.id,
      candidateUserId: req.user.id,
      companyUserId: job.companyUserId || null,
      status: 'recebida',
      coverNote: normalizeOptionalValue(req.body.coverNote)
    });

    return res.redirect('/vagas?status=' + encodeURIComponent('Candidatura enviada com sucesso.'));
  } catch (error) {
    console.error(error);
    return res.redirect('/vagas?error=' + encodeURIComponent('Não foi possível concluir a candidatura.'));
  }
};
