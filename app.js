require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize, connectDB } = require('./config/database');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

require('./models/User');
require('./models/Job');
require('./models/Course');
require('./models/ContactMessage');
require('./models/PublicSelection');
require('./models/Advertisement');
require('./models/Menu');
const Setting = require('./models/Setting');
const Menu = require('./models/Menu');
const { ensureDefaultMenus } = require('./utils/menuDefaults');

const app = express();
const sessionStore = new SequelizeStore({ db: sequelize });

require('./config/passport')(passport);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'site/layout');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(async (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;

  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }

    await ensureDefaultMenus();

    const menus = await Menu.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['id', 'ASC']]
    });

    res.locals.globalSetting = setting;
    res.locals.menus = menus;
  } catch (error) {
    console.error('Erro ao carregar configurações globais:', error);
    res.locals.globalSetting = {};
    res.locals.menus = [];
  }

  next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/perfil', require('./routes/user'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('site/sobre', { title: 'Página não encontrada' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await sessionStore.sync();
  await ensureDefaultMenus();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
