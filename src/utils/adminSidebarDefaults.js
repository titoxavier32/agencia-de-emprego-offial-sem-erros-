const DEFAULT_ADMIN_SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', href: '/admin/dashboard', group: 'Visao geral', order: 1, isActive: true },
  { key: 'cursos', label: 'Cursos', icon: 'fa-graduation-cap', href: '/admin/cursos', group: 'Publicacoes', order: 1, isActive: true },
  { key: 'selecoes_publicas', label: 'Seleções públicas', icon: 'fa-file-signature', href: '/admin/selecoes-publicas', group: 'Publicacoes', order: 2, isActive: true },
  { key: 'eventos', label: 'Eventos', icon: 'fa-calendar-star', href: '/admin/events', group: 'Publicacoes', order: 3, isActive: true },
  { key: 'propagandas', label: 'Propagandas', icon: 'fa-bullhorn', href: '/admin/propagandas', group: 'Publicacoes', order: 4, isActive: true },
  { key: 'empresas', label: 'Empresas', icon: 'fa-building', href: '/admin/empresas', group: 'Recrutamento', order: 1, isActive: true },
  { key: 'vagas', label: 'Vagas', icon: 'fa-briefcase', href: '/admin/vagas', group: 'Recrutamento', order: 2, isActive: true },
  { key: 'candidaturas', label: 'Candidaturas', icon: 'fa-file-circle-check', href: '/admin/candidaturas', group: 'Recrutamento', order: 3, isActive: true },
  { key: 'contatos', label: 'Contatos', icon: 'fa-envelope-open-text', href: '/admin/contatos', group: 'Estrutura do painel', order: 1, isActive: true },
  { key: 'usuarios', label: 'Usuarios', icon: 'fa-users', href: '/admin/usuarios', group: 'Estrutura do painel', order: 2, isActive: true },
  { key: 'menus', label: 'Menus', icon: 'fa-bars-staggered', href: '/admin/menus', group: 'Estrutura do painel', order: 3, isActive: true },
  { key: 'estrutura_site', label: 'Estrutura do site', icon: 'fa-diagram-project', href: '/admin/estrutura-site', group: 'Estrutura do painel', order: 4, isActive: true },
  { key: 'configuracoes', label: 'Configurações', icon: 'fa-sliders', href: '/admin/configuracoes', group: 'Estrutura do painel', order: 5, isActive: true }
];

const normalizeOptionalValue = (value) => value ? String(value).trim() : '';
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const ADMIN_GROUP_ORDER = ['Visao geral', 'Publicacoes', 'Recrutamento', 'Estrutura do painel'];

const getDefaultAdminSidebarItems = () => DEFAULT_ADMIN_SIDEBAR_ITEMS.map((item) => ({ ...item }));

const mergeAdminSidebarItems = (items) => {
  const storedMap = new Map((Array.isArray(items) ? items : []).map((item) => [item.key, item]));

  return getDefaultAdminSidebarItems().map((item) => {
    const storedItem = storedMap.get(item.key);
    if (!storedItem) return item;

    return {
      ...item,
      label: normalizeOptionalValue(storedItem.label) || item.label,
      group: normalizeOptionalValue(storedItem.group) || item.group,
      order: Number.isFinite(Number(storedItem.order)) ? Number(storedItem.order) : item.order,
      isActive: typeof storedItem.isActive === 'boolean' ? storedItem.isActive : item.isActive
    };
  });
};

const parseAdminSidebarConfig = (rawValue) => {
  if (!rawValue) {
    return getDefaultAdminSidebarItems();
  }

  try {
    const parsed = JSON.parse(rawValue);
    return mergeAdminSidebarItems(parsed);
  } catch (error) {
    return getDefaultAdminSidebarItems();
  }
};

const forceAdminSidebarVisibility = (items) => mergeAdminSidebarItems(items).map((item) => ({
  ...item,
  isActive: true
}));

const buildAdminSidebarItemsFromBody = (body) => {
  const keys = ensureArray(body.adminSidebarKey);
  const labels = ensureArray(body.adminSidebarLabel);
  const groups = ensureArray(body.adminSidebarGroup);
  const orders = ensureArray(body.adminSidebarOrder);
  const activeKeys = new Set(ensureArray(body.adminSidebarActive));
  const defaultMap = new Map(getDefaultAdminSidebarItems().map((item) => [item.key, item]));

  const normalizedItems = keys
    .map((key, index) => {
      const normalizedKey = normalizeOptionalValue(key);
      const fallback = defaultMap.get(normalizedKey);
      if (!fallback) return null;

      return {
        ...fallback,
        label: normalizeOptionalValue(labels[index]) || fallback.label,
        group: normalizeOptionalValue(groups[index]) || fallback.group,
        order: Number.isFinite(Number(orders[index])) ? Number(orders[index]) : fallback.order,
        isActive: activeKeys.has(normalizedKey)
      };
    })
    .filter(Boolean);

  return mergeAdminSidebarItems(normalizedItems);
};

const groupAdminSidebarItems = (items, currentPath) => {
  const groups = [];
  const groupMap = new Map();

  items
    .filter((item) => item.isActive)
    .sort((a, b) => {
      const aGroupIndex = ADMIN_GROUP_ORDER.indexOf(String(a.group));
      const bGroupIndex = ADMIN_GROUP_ORDER.indexOf(String(b.group));
      const groupCompare = (aGroupIndex === -1 ? Number.MAX_SAFE_INTEGER : aGroupIndex) - (bGroupIndex === -1 ? Number.MAX_SAFE_INTEGER : bGroupIndex);
      if (groupCompare !== 0) return groupCompare;
      if (String(a.group) !== String(b.group)) return String(a.group).localeCompare(String(b.group), 'pt-BR');
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label, 'pt-BR');
    })
    .forEach((item) => {
      const groupTitle = normalizeOptionalValue(item.group) || 'Estrutura do painel';
      if (!groupMap.has(groupTitle)) {
        const nextGroup = { title: groupTitle, items: [] };
        groupMap.set(groupTitle, nextGroup);
        groups.push(nextGroup);
      }

      groupMap.get(groupTitle).items.push({
        href: item.href,
        icon: item.icon,
        label: item.label,
        active: currentPath === item.href || currentPath.indexOf(`${item.href}/`) === 0
      });
    });

  return groups;
};

module.exports = {
  getDefaultAdminSidebarItems,
  parseAdminSidebarConfig,
  forceAdminSidebarVisibility,
  buildAdminSidebarItemsFromBody,
  groupAdminSidebarItems
};

