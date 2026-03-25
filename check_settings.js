const { sequelize } = require('./config/database');
const Setting = require('./models/Setting');
(async () => {
    try {
        const info = await sequelize.query("PRAGMA table_info('Settings');");
        console.log("Settings columns:", JSON.stringify(info[0], null, 2));
    } catch(e) { console.error(e) }
    process.exit();
})();
