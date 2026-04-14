const { sequelize } = require('./src/config/database');
const run = async () => {
  try {
    // 1. Corrigir o link do menu Início
    await sequelize.query("UPDATE Menus SET url = '/' WHERE label LIKE '%In%cio%'");
    
    // 2. Corrigir a ordem das seções da Home
    await sequelize.query("UPDATE Settings SET homeSectionOrder = 'top_ads,hero,jobs,mural,company_showcase,courses,public_selections,contact,survey' WHERE id = 1");
    
    console.log('✅ DATABASE FIX APPLIED SUCCESSFULLY');
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  } finally {
    process.exit();
  }
};
run();
