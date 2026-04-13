require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, connectDB } = require('../config/database');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Course = require('../models/Course');
const Advertisement = require('../models/Advertisement');

const runSeed = async () => {
  try {
    await connectDB();
    
    // Check Admin
    let admin = await User.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@admin.com' } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', salt);
      await User.create({
        name: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@admin.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created! login: admin@admin.com / Admin123!');
    } else {
      console.log('Admin user already exists.');
    }

    // Check Settings
    let setting = await Setting.findOne();
    if (!setting) {
      await Setting.create({ themeColor: 'white' });
      console.log('Global settings initialized!');
    }

    // Check Courses
    const courseCount = await Course.count();
    if (courseCount === 0) {
      await Course.bulkCreate([
        {
          title: 'Desenvolvimento Web Full Stack',
          description: 'Aprenda do zero ao avançado com as tecnologias mais requisitadas do mercado: Node.js, React e Bancos de Dados.',
          image: 'WhatsApp Image 2026-03-19 at 14.44.22.jpeg',
          link: 'https://seusite.com/curso-web',
          startDate: '2026-05-01',
          endDate: '2026-12-20'
        },
        {
          title: 'Marketing Digital Estratégico',
          description: 'Domine tráfego pago, SEO e estratégias de conversão para alavancar negócios locais e digitais.',
          image: '',
          link: 'https://seusite.com/marketing',
          startDate: '2026-06-15',
          endDate: '2026-08-30'
        }
      ]);
      console.log('Example courses created!');
    }

    // Check Advertisements
    const adCount = await Advertisement.count();
    if (adCount === 0) {
      await Advertisement.bulkCreate([
        {
          title: 'JTX Info - Soluções em TI',
          description: 'Suporte técnico e consultoria para empresas.',
          image: 'JTX INFO.jpeg',
          link: 'https://jtxinfo.com.br',
          placement: 'hero_top',
          groupName: 'Destaque',
          position: 1,
          width: 728,
          height: 90,
          animation: 'pulse'
        },
        {
          title: 'UniVendas - Curso de Vendas',
          description: 'Aumente o faturamento da sua equipe.',
          image: 'uni-banner.png',
          link: 'https://univendas.edu.br',
          placement: 'mural_home',
          groupName: 'Educação',
          position: 1,
          width: 500,
          height: 105,
          animation: 'fade'
        },
        {
           title: 'Amizade Decor - Móveis e Decoração',
           description: 'Transforme sua casa com estilo.',
           image: 'amizade_decorar.gif',
           link: 'https://amizadedecor.com.br',
           placement: 'mural_home',
           groupName: 'Casa',
           position: 2,
           width: 500,
           height: 105,
           animation: 'slide'
        }
      ]);
      console.log('Example advertisements created!');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runSeed();
