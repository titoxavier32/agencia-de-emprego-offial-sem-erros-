const { sequelize } = require('./config/database');
(async () => {
    try {
        const info = await sequelize.query("PRAGMA table_info('Sessions');");
        console.log("Sessions table columns:", info[0].map(c => c.name));
    } catch(e) { console.error(e) }
    process.exit();
})();
