const Setting = require('../src/models/Setting');
const { sequelize } = require('../src/config/database');

async function fix() {
  try {
    await sequelize.authenticate();
    const setting = await Setting.findOne();
    if (setting) {
      const order = setting.homeSectionOrder || 'top_ads,hero,jobs,mural,company_showcase,contact,courses,public_selections';
      let newOrder = order;
      if (!order.includes('survey')) {
        newOrder = order + ',survey';
      }
      
      await setting.update({ 
        homeSurveyEnabled: true,
        homeSectionOrder: newOrder
      });
      console.log('Fix aplicado com sucesso!');
      console.log('Ordem final:', newOrder);
      console.log('Habilitado:', true);
    }
  } catch (error) {
    console.error('Erro no fix:', error);
  } finally {
    process.exit();
  }
}

fix();
