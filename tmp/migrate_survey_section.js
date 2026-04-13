const Setting = require('../src/models/Setting');

async function migrate() {
  try {
    const setting = await Setting.findOne();
    if (setting) {
      const order = setting.homeSectionOrder || 'top_ads,hero,jobs,mural,company_showcase,contact,courses,public_selections';
      if (!order.includes('survey')) {
        const newOrder = order + ',survey';
        await setting.update({ homeSectionOrder: newOrder });
        console.log('Ordem da home atualizada com sucesso!');
      } else {
        console.log('A seção survey já está na ordem da home.');
      }
    } else {
      console.log('Nenhuma configuração encontrada para migrar.');
    }
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    process.exit();
  }
}

migrate();
