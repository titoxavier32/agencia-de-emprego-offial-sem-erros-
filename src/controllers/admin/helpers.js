const { normalizeText } = require('../../utils/textNormalizer');

const normalizeOptionalValue = (value) => (value ? value.trim() : '');

const parsePositiveInteger = (value, fallback, minimum = 0) => {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(parsed, minimum);
};

const getSingleFileName = (file) => (file ? file.filename : '');
const getSelectionFile = (files, fieldName) => (files && files[fieldName] ? files[fieldName][0] : null);
const redirectWithMessage = (path, queryKey, message) => `${path}?${queryKey}=${encodeURIComponent(message)}`;
const buildSelectionErrorRedirect = (basePath, message) => redirectWithMessage(basePath, 'error', message);
const buildSelectionScheduleDefaults = () => [{ label: '', date: '' }];
const buildSelectionVacancyDefaults = () => [{ role: '', total: '', pcd: '', race: '', income: '', workload: '', salary: '', zone: '', workplace: '' }];

const HOME_SECTION_KEYS = ['top_ads', 'hero', 'jobs', 'mural', 'company_showcase', 'contact', 'courses', 'public_selections'];

const buildHomeSectionOrderFromBody = (body) => {
  const parsed = HOME_SECTION_KEYS.map((key, index) => ({
    key,
    order: parseInt(body['homeOrder_' + key], 10) || index + 1
  }));

  return parsed
    .sort((left, right) => left.order - right.order || HOME_SECTION_KEYS.indexOf(left.key) - HOME_SECTION_KEYS.indexOf(right.key))
    .map((item) => item.key)
    .join(',');
};

const moveSectionAfter = (sections, sectionKey, anchorKey) => {
  const filtered = sections.filter((key) => key !== sectionKey);
  const anchorIndex = filtered.indexOf(anchorKey);

  if (anchorIndex === -1) {
    filtered.push(sectionKey);
    return filtered;
  }

  filtered.splice(anchorIndex + 1, 0, sectionKey);
  return filtered;
};

const moveSectionBefore = (sections, sectionKey, anchorKey) => {
  const filtered = sections.filter((key) => key !== sectionKey);
  const anchorIndex = filtered.indexOf(anchorKey);

  if (anchorIndex === -1) {
    filtered.unshift(sectionKey);
    return filtered;
  }

  filtered.splice(anchorIndex, 0, sectionKey);
  return filtered;
};

const buildResolvedHomeSectionOrder = (body) => {
  let sections = buildHomeSectionOrderFromBody(body)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => HOME_SECTION_KEYS.includes(item));

  HOME_SECTION_KEYS.forEach((key) => {
    if (!sections.includes(key)) sections.push(key);
  });

  const heroPlacement = normalizeOptionalValue(body.heroPlacement) || 'after_top_ads';
  if (heroPlacement === 'before_top_ads') {
    sections = moveSectionBefore(sections, 'hero', 'top_ads');
  } else if (heroPlacement === 'after_mural') {
    sections = moveSectionAfter(sections, 'hero', 'mural');
  } else {
    sections = moveSectionAfter(sections, 'hero', 'top_ads');
  }

  const companyShowcasePlacement = normalizeOptionalValue(body.companyShowcasePlacement) || 'after_mural';
  if (companyShowcasePlacement === 'after_hero') {
    sections = moveSectionAfter(sections, 'company_showcase', 'hero');
  } else if (companyShowcasePlacement === 'after_jobs') {
    sections = moveSectionAfter(sections, 'company_showcase', 'jobs');
  } else {
    sections = moveSectionAfter(sections, 'company_showcase', 'mural');
  }

  return sections.join(',');
};

const parseCurrencyToNumber = (value) => {
  if (!value) return 0;
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrencyBRL = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value || 0);

const buildPaymentSummary = (contacts) => {
  const summary = {
    totalReceived: 0,
    totalPending: 0,
    totalUnderReview: 0,
    receivedCount: 0,
    pendingCount: 0,
    underReviewCount: 0
  };

  contacts.forEach((contact) => {
    if (!contact.paymentRequired) return;
    if (contact.paymentStatus === 'primeiro_mes_gratuito') return;

    const amount = parseCurrencyToNumber(contact.paymentAmount);

    if (contact.paymentStatus === 'pagamento_confirmado') {
      summary.totalReceived += amount;
      summary.receivedCount += 1;
      return;
    }

    if (contact.paymentStatus === 'pagamento_informado') {
      summary.totalUnderReview += amount;
      summary.underReviewCount += 1;
      return;
    }

    summary.totalPending += amount;
    summary.pendingCount += 1;
  });

  return {
    ...summary,
    totalReceivedLabel: formatCurrencyBRL(summary.totalReceived),
    totalPendingLabel: formatCurrencyBRL(summary.totalPending),
    totalUnderReviewLabel: formatCurrencyBRL(summary.totalUnderReview)
  };
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const normalizeScheduleItems = (body) => {
  const labels = ensureArray(body.scheduleLabel);
  const dates = ensureArray(body.scheduleDate);

  return labels
    .map((label, index) => ({
      label: normalizeOptionalValue(label),
      date: normalizeOptionalValue(dates[index])
    }))
    .filter((item) => item.label || item.date);
};

const normalizeVacancyItems = (body) => {
  const fields = {
    role: ensureArray(body.vacancyRole),
    total: ensureArray(body.vacancyTotal),
    pcd: ensureArray(body.vacancyPcd),
    race: ensureArray(body.vacancyRace),
    income: ensureArray(body.vacancyIncome),
    workload: ensureArray(body.vacancyWorkload),
    salary: ensureArray(body.vacancySalary),
    zone: ensureArray(body.vacancyZone),
    workplace: ensureArray(body.vacancyWorkplace)
  };

  return fields.role
    .map((role, index) => ({
      role: normalizeOptionalValue(role),
      total: normalizeOptionalValue(fields.total[index]),
      pcd: normalizeOptionalValue(fields.pcd[index]),
      race: normalizeOptionalValue(fields.race[index]),
      income: normalizeOptionalValue(fields.income[index]),
      workload: normalizeOptionalValue(fields.workload[index]),
      salary: normalizeOptionalValue(fields.salary[index]),
      zone: normalizeOptionalValue(fields.zone[index]),
      workplace: normalizeOptionalValue(fields.workplace[index])
    }))
    .filter((item) => Object.values(item).some(Boolean));
};

const parseStoredCollection = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('|').map((item) => item.trim()));
  }
};

const buildPublicSelectionPayload = (body, files) => ({
  title: normalizeOptionalValue(body.title),
  description: normalizeOptionalValue(body.description),
  category: body.category || 'processo_seletivo',
  processNumber: normalizeOptionalValue(body.processNumber),
  selectionType: normalizeOptionalValue(body.selectionType),
  legalRegime: normalizeOptionalValue(body.legalRegime),
  duration: normalizeOptionalValue(body.duration),
  isExtendable: body.isExtendable === 'on',
  status: normalizeOptionalValue(body.status) || 'Publicado',
  organizer: normalizeOptionalValue(body.organizer),
  destinationAgency: normalizeOptionalValue(body.destinationAgency),
  sphere: normalizeOptionalValue(body.sphere) || '',
  region: normalizeOptionalValue(body.region) || '',
  salary: normalizeOptionalValue(body.salary) || '',
  educationLevel: normalizeOptionalValue(body.educationLevel) || '',
  processWebsite: normalizeOptionalValue(body.processWebsite) || '',
  registrationLocation: normalizeOptionalValue(body.registrationLocation),
  noticePublicationDate: body.noticePublicationDate || null,
  registrationStartDate: body.registrationStartDate || null,
  registrationEndDate: body.registrationEndDate || null,
  targetAudience: normalizeOptionalValue(body.targetAudience),
  link: normalizeOptionalValue(body.link),
  schedule: JSON.stringify(normalizeScheduleItems(body)),
  vacancies: JSON.stringify(normalizeVacancyItems(body)),
  ...(files && files.image ? { image: files.image[0].filename } : {}),
  ...(files && files.noticePdf ? {
    noticePdf: files.noticePdf[0].filename,
    noticePdfOriginalName: files.noticePdf[0].originalname
  } : {})
});

const buildPublicSelectionFormState = (publicSelection = null) => {
  if (!publicSelection) {
    return {
      publicSelection: null,
      scheduleItems: buildSelectionScheduleDefaults(),
      vacancyItems: buildSelectionVacancyDefaults()
    };
  }

  const scheduleItems = parseStoredCollection(publicSelection.schedule).map((item) => ({
    label: item.label || item[0] || '',
    date: item.date || item[1] || ''
  }));
  const vacancyItems = parseStoredCollection(publicSelection.vacancies).map((item) => ({
    role: item.role || item[0] || '',
    total: item.total || item[1] || '',
    pcd: item.pcd || item[2] || '',
    race: item.race || item[3] || '',
    income: item.income || item[4] || '',
    workload: item.workload || item[5] || '',
    salary: item.salary || item[6] || '',
    zone: item.zone || item[7] || '',
    workplace: item.workplace || item[8] || ''
  }));

  return {
    publicSelection,
    scheduleItems: scheduleItems.length > 0 ? scheduleItems : buildSelectionScheduleDefaults(),
    vacancyItems: vacancyItems.length > 0 ? vacancyItems : buildSelectionVacancyDefaults()
  };
};

const buildJobPayload = (body, imageFileName = '') => ({
  title: body.title,
  description: body.description,
  requirements: body.requirements,
  benefits: body.benefits,
  link: body.link,
  image: imageFileName,
  location: body.location,
  salary: body.salary,
  employmentType: body.employmentType,
  workplaceMode: body.workplaceMode,
  vacancies: parsePositiveInteger(body.vacancies, 1, 1),
  status: body.status || 'ativa',
  startDate: body.startDate || null,
  endDate: body.endDate || null
});

const buildJobUpdatePayload = (body, file) => {
  const payload = {
    title: body.title,
    description: body.description,
    requirements: body.requirements,
    benefits: body.benefits,
    link: body.link,
    location: body.location,
    salary: body.salary,
    employmentType: body.employmentType,
    workplaceMode: body.workplaceMode,
    vacancies: parsePositiveInteger(body.vacancies, 1, 1),
    status: body.status || 'ativa',
    startDate: body.startDate || null,
    endDate: body.endDate || null
  };

  if (file) {
    payload.image = file.filename;
  }

  return payload;
};

const buildCoursePayload = (body, imageFileName = '') => ({
  title: body.title,
  description: body.description,
  link: body.link,
  image: imageFileName,
  startDate: body.startDate || null,
  endDate: body.endDate || null
});

const buildCourseUpdatePayload = (body, file) => {
  const payload = {
    title: body.title,
    description: body.description,
    link: body.link,
    startDate: body.startDate || null,
    endDate: body.endDate || null
  };

  if (file) {
    payload.image = file.filename;
  }

  return payload;
};

const normalizeAdvertisementPlacement = (value) => {
  const allowedPlacements = new Set(['hero_top', 'mural_home']);
  return allowedPlacements.has(value) ? value : 'mural_home';
};

const normalizeAdvertisementGroupName = (value) => {
  const normalized = normalizeOptionalValue(value);
  return normalized || 'Geral';
};

const normalizeAdvertisementPosition = (value) => {
  const position = parseInt(value, 10);
  return Number.isInteger(position) && position > 0 ? position : 1;
};

const buildAdvertisementPayload = (body, file = null) => {
  const payload = {
    title: normalizeOptionalValue(body.title),
    description: normalizeOptionalValue(body.description),
    link: normalizeOptionalValue(body.link),
    placement: normalizeAdvertisementPlacement(body.placement),
    groupName: normalizeAdvertisementGroupName(body.groupName),
    position: normalizeAdvertisementPosition(body.position),
    width: parsePositiveInteger(body.width, 500),
    height: parsePositiveInteger(body.height, 105),
    animation: body.animation || 'pulse',
    order: parsePositiveInteger(body.order, 0),
    isActive: body.isActive === 'on'
  };

  if (file) {
    payload.image = file.filename;
  }

  return payload;
};

const normalizeDeepText = (value) => {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeDeepText);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, normalizeDeepText(entryValue)]));
  }
  return value;
};

const normalizeJsonText = (value) => {
  if (!value) return value;

  try {
    return JSON.stringify(normalizeDeepText(JSON.parse(value)));
  } catch (error) {
    return normalizeText(value);
  }
};

const normalizeInstanceFields = async (instance, fields) => {
  let changed = false;

  fields.forEach((field) => {
    if (typeof instance[field] !== 'string' || !instance[field]) return;
    const normalizedValue = field === 'adminSidebarConfig' ? normalizeJsonText(instance[field]) : normalizeText(instance[field]);
    if (normalizedValue !== instance[field]) {
      instance[field] = normalizedValue;
      changed = true;
    }
  });

  if (changed) {
    await instance.save();
  }

  return changed;
};

const buildAdvertisementVisualSections = (advertisements) => {
  const placementMeta = [
    {
      key: 'hero_top',
      title: 'Acima da plataforma profissional',
      description: 'Faixa de banners posicionada antes do banner principal da home.'
    },
    {
      key: 'mural_home',
      title: 'Mural publicitario da home',
      description: 'Area do mural com os quadros comerciais exibidos na pagina inicial.'
    }
  ];

  return placementMeta.map((section) => {
    const items = advertisements.filter((advertisement) => (advertisement.placement || 'mural_home') === section.key);
    const groupedMap = items.reduce((accumulator, advertisement) => {
      const groupName = advertisement.groupName || 'Geral';
      if (!accumulator[groupName]) {
        accumulator[groupName] = [];
      }
      accumulator[groupName].push(advertisement);
      return accumulator;
    }, {});

    const groups = Object.keys(groupedMap).length > 0 ? Object.keys(groupedMap) : ['Geral'];
    const visualGroups = groups
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((groupName) => {
        const groupItems = (groupedMap[groupName] || []).sort((left, right) => {
          if ((left.position || 1) !== (right.position || 1)) {
            return (left.position || 1) - (right.position || 1);
          }
          if ((left.order || 0) !== (right.order || 0)) {
            return (left.order || 0) - (right.order || 0);
          }
          return new Date(left.createdAt) - new Date(right.createdAt);
        });
        const maxPosition = Math.max(3, ...groupItems.map((item) => item.position || 1));
        const slots = Array.from({ length: maxPosition }, (_, index) => {
          const position = index + 1;
          return {
            position,
            advertisement: groupItems.find((item) => (item.position || 1) === position) || null
          };
        });

        return { groupName, slots };
      });

    return {
      ...section,
      groups: visualGroups
    };
  });
};

const buildCompanyShowcaseStatus = (company) => ({
  isVisible: Boolean(company.companyShowcaseEnabled && company.companyShowcaseLgpdConsent && company.status === 'ativo'),
  displayName: company.companyPublicDisplayName || company.companyTradeName || company.companyLegalName || company.name || 'Empresa cadastrada'
});

const buildSiteStructureMeta = () => ({
  top_ads: { label: 'Topo com destaque', description: 'A faixa inicial de banners que recebe a maior atencao visual.' },
  hero: { label: 'Hero principal', description: 'A abertura do site com proposta de valor, chamadas e estatisticas.' },
  jobs: { label: 'Vagas publicadas', description: 'Lista de oportunidades para candidatos e empresas parceiras.' },
  mural: { label: 'Mural publicitario', description: 'Bloco comercial com anuncios e posicionamento estrategico.' },
  company_showcase: { label: 'Empresas parceiras', description: 'Vitrine institucional para reforcar confianca e credibilidade.' },
  contact: { label: 'Contato', description: 'Ponto de conversao para mensagens, suporte e relacionamento.' },
  courses: { label: 'Cursos', description: 'Area de formacao e desenvolvimento para ampliar a recorrencia.' },
  public_selections: { label: 'Selecoes publicas', description: 'Conteudo de editais, cronogramas e processos seletivos.' }
});

module.exports = {
  HOME_SECTION_KEYS,
  buildAdvertisementPayload,
  buildAdvertisementVisualSections,
  buildCompanyShowcaseStatus,
  buildCoursePayload,
  buildCourseUpdatePayload,
  buildHomeSectionOrderFromBody,
  buildJobPayload,
  buildJobUpdatePayload,
  buildPaymentSummary,
  buildPublicSelectionFormState,
  buildPublicSelectionPayload,
  buildResolvedHomeSectionOrder,
  buildSelectionErrorRedirect,
  buildSelectionScheduleDefaults,
  buildSelectionVacancyDefaults,
  buildSiteStructureMeta,
  ensureArray,
  formatCurrencyBRL,
  getSelectionFile,
  getSingleFileName,
  moveSectionAfter,
  moveSectionBefore,
  normalizeAdvertisementGroupName,
  normalizeAdvertisementPlacement,
  normalizeAdvertisementPosition,
  normalizeDeepText,
  normalizeInstanceFields,
  normalizeJsonText,
  normalizeOptionalValue,
  normalizeScheduleItems,
  normalizeVacancyItems,
  parseCurrencyToNumber,
  parsePositiveInteger,
  parseStoredCollection,
  redirectWithMessage
};
