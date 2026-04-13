const Menu = require('../src/models/Menu');
const { sequelize } = require('../src/config/database');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const missingMenus = [
      { label: 'Eventos', url: '/eventos', icon: 'fa-calendar-check', order: 7, isActive: true },
      { label: 'Mural Publicitário', url: '/mural-publicitario', icon: 'fa-ad', order: 8, isActive: true },
      { label: 'Empresas Parceiras', url: '/empresas-parceiras', icon: 'fa-handshake', order: 9, isActive: true }
    ];

    for (const data of missingMenus) {
      const [menu, created] = await Menu.findOrCreate({
        where: { url: data.url },
        defaults: data
      });
      if (created) {
        console.log(`Menu created: ${data.label}`);
      } else {
        console.log(`Menu already exists: ${data.label}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
}

seed();
