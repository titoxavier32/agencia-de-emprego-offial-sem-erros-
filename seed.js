require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, connectDB } = require('./config/database');
const User = require('./models/User');
const Setting = require('./models/Setting');

const runSeed = async () => {
  try {
    await connectDB();
    
    // Check Admin
    let admin = await User.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@agencia.com' } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', salt);
      await User.create({
        name: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@agencia.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created! login: admin@agencia.com / Admin123!');
    } else {
      console.log('Admin user already exists.');
    }

    // Check Settings
    let setting = await Setting.findOne();
    if (!setting) {
      await Setting.create({ themeColor: 'white' });
      console.log('Global settings initialized!');
    } else {
      console.log('Global settings already exist.');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runSeed();
