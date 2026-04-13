const { sequelize } = require('../src/config/database');
const Menu = require('../src/models/Menu');

async function checkMenus() {
  try {
    await sequelize.authenticate();
    const menus = await Menu.findAll();
    console.log('--- CURRENT MENUS ---');
    console.log(JSON.stringify(menus, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkMenus();
