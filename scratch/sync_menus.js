const { sequelize } = require('../src/config/database');
const { ensureDefaultMenus } = require('../src/utils/menuDefaults');
const Menu = require('../src/models/Menu');

async function syncMenus() {
  try {
    await sequelize.authenticate();
    console.log('--- SYNCING MENUS ---');
    await ensureDefaultMenus();
    const menus = await Menu.findAll();
    console.log('--- UPDATED MENUS ---');
    console.log(JSON.stringify(menus, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

syncMenus();
