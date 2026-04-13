const Setting = require('./src/models/Setting');
const { sequelize } = require('./src/config/database');

async function check() {
  try {
    await sequelize.authenticate();
    const setting = await Setting.findOne();
    if (setting) {
      console.log('--- Configurações Atuais ---');
      console.log('homeSurveyEnabled:', setting.homeSurveyEnabled);
      console.log('homeSurveyTitle:', setting.homeSurveyTitle);
      console.log('homeSectionOrder:', setting.homeSectionOrder);
    } else {
      console.log('Nenhuma configuração encontrada.');
    }
  } catch (error) {
    console.error('Erro ao verificar:', error);
  } finally {
    process.exit();
  }
}

check();
