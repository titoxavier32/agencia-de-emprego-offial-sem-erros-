// Script temporário para mudar navbarPosition para 'top' via SQL direto
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    // Atualiza diretamente na tabela Settings
    const [results] = await sequelize.query("UPDATE Settings SET navbarPosition = 'top'");
    console.log('✅ navbarPosition alterado para "top" com sucesso!');
  } catch (err) {
    console.error('Erro:', err.message);
    // Tenta com nome da tabela alternativo
    try {
      const [results] = await sequelize.query("UPDATE Setting SET navbarPosition = 'top'");
      console.log('✅ navbarPosition alterado para "top" com sucesso! (tabela Setting)');
    } catch (err2) {
      console.error('Erro na tentativa 2:', err2.message);
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();
