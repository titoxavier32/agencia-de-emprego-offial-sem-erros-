const Menu = require('../models/Menu');

const DEFAULT_MENUS = [
  { label: 'Início', url: '/', icon: 'fa-house', order: 1, isActive: true, target: '_self' },
  { label: 'Vagas', url: '/vagas', icon: 'fa-briefcase', order: 2, isActive: true, target: '_self' },
  { label: 'Cursos', url: '/cursos', icon: 'fa-graduation-cap', order: 3, isActive: true, target: '_self' },
  { label: 'Seleções públicas', url: '/selecoes-publicas', icon: 'fa-file-signature', order: 4, isActive: true, target: '_self' },
  { label: 'Quem Somos', url: '/sobre', icon: 'fa-circle-info', order: 5, isActive: true, target: '_self' },
  { label: 'Contato', url: '/contato', icon: 'fa-envelope', order: 6, isActive: true, target: '_self' }
];

const ensureDefaultMenus = async () => {
  const existingMenus = await Menu.findAll({
    attributes: ['id', 'url', 'label', 'icon', 'order', 'target', 'isActive']
  });

  const existingByUrl = new Map(existingMenus.map((menu) => [menu.url, menu]));
  const missingMenus = DEFAULT_MENUS.filter((item) => !existingByUrl.has(item.url));

  if (missingMenus.length > 0) {
    await Menu.bulkCreate(missingMenus);
  }

  for (const item of DEFAULT_MENUS) {
    const existing = existingByUrl.get(item.url);
    if (!existing) continue;

    const updateData = {};

    // Forçar atualização se o rótulo for "Sobre" para migrar para "Quem Somos"
    if (existing.label === 'Sobre' && item.label === 'Quem Somos') {
      updateData.label = item.label;
      updateData.icon = item.icon; // Aproveitar para atualizar o ícone também
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
};

module.exports = {
  DEFAULT_MENUS,
  ensureDefaultMenus
};
