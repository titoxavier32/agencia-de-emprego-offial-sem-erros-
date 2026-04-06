const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function checkAdmin() {
  await sequelize.authenticate();
  const admins = await User.findAll({ where: { role: 'admin' } });
  console.log('Admins found:', admins.map(a => ({ email: a.email, role: a.role })));
  process.exit();
}

checkAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
