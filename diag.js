const Setting = require('./models/Setting');
const { sequelize } = require('./config/database');

async function check() {
  try {
    const setting = await Setting.findOne();
    console.log('Current Setting:', JSON.stringify(setting, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
