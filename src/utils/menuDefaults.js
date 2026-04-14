const Menu = require('../models/Menu');

const DEFAULT_MENUS = [
  { label: 'In\u00edcio', url: '/', icon: 'fa-house', order: 1, isActive: true, target: '_self' },
  { label: 'Vagas', url: '/vagas', icon: 'fa-briefcase', order: 2, isActive: true, target: '_self' },
  { label: 'Cursos', url: '/cursos', icon: 'fa-graduation-cap', order: 3, isActive: true, target: '_self' },
  { label: 'Sele\u00e7\u00f5es p\u00fablicas', url: '/selecoes-publicas', icon: 'fa-file-signature', order: 4, isActive: true, target: '_self' },
  { label: 'Quem Somos', url: '/sobre', icon: 'fa-circle-info', order: 5, isActive: true, target: '_self' },
  { label: 'Contato', url: '/contato', icon: 'fa-envelope', order: 6, isActive: true, target: '_self' }
];

const normalizeLabel = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const normalizeMenuUrl = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  if (/^(https?:)?\/\//i.test(rawValue) || /^(mailto|tel):/i.test(rawValue) || rawValue.startsWith('#')) {
    return rawValue;
  }

  let normalized = rawValue.replace(/\\/g, '/');

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, '/');

  if (['/quem-somos', '/sobre-nos'].includes(normalized)) {
    return '/sobre';
  }

  return normalized;
};

const isAboutMenu = (menu) => ['sobre', 'quem somos'].includes(normalizeLabel(menu && menu.label));

const ensureDefaultMenus = async () => {
  const existingMenus = await Menu.findAll({
    attributes: ['id', 'url', 'label', 'icon', 'order', 'target', 'isActive']
  });

  for (const item of DEFAULT_MENUS) {
    const normalizedTargetUrl = normalizeMenuUrl(item.url);
    const existing = existingMenus.find((menu) => {
      const normalizedCurrentUrl = normalizeMenuUrl(menu.url);
      if (normalizedCurrentUrl === normalizedTargetUrl) return true;
      return normalizedTargetUrl === '/sobre' && isAboutMenu(menu);
    });

    if (!existing) continue;

    const updateData = {};
    const normalizedCurrentUrl = normalizeMenuUrl(existing.url);

    if (normalizedCurrentUrl !== normalizedTargetUrl) {
      updateData.url = normalizedTargetUrl;
    }

    if (existing.label === 'Sobre' && item.label === 'Quem Somos') {
      updateData.label = item.label;
      updateData.icon = item.icon;
    } else if (!existing.label) {
      updateData.label = item.label;
    }

    if (!existing.icon) updateData.icon = item.icon;
    if (!existing.target) updateData.target = item.target;
    if (existing.order === null || existing.order === undefined) updateData.order = item.order;
    if (existing.isActive === null || existing.isActive === undefined) updateData.isActive = item.isActive;

    if (Object.keys(updateData).length > 0) {
      await existing.update(updateData);
    }
  }

  const refreshedMenus = await Menu.findAll({
    attributes: ['id', 'url', 'label', 'icon', 'order', 'target', 'isActive']
  });
  const existingByUrl = new Map(refreshedMenus.map((menu) => [normalizeMenuUrl(menu.url), menu]));
  const missingMenus = DEFAULT_MENUS.filter((item) => !existingByUrl.has(normalizeMenuUrl(item.url)));

  if (missingMenus.length > 0) {
    await Menu.bulkCreate(missingMenus);
  }
};

module.exports = {
  DEFAULT_MENUS,
  ensureDefaultMenus,
  normalizeMenuUrl
};
