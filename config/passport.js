const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy for Admin
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'E-mail não cadastrado.' });
        }

        if (user.role !== 'admin') {
          return done(null, false, { message: 'Acesso negado.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Senha incorreta.' });
        }
      } catch (err) {
        return done(err);
      }
    })
  );

  // Google Strategy for Users
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
        callbackURL: '/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          role: 'user'
        };

        try {
          let user = await User.findOne({ where: { googleId: profile.id } });
          if (user) {
            done(null, user);
          } else {
            if (newUser.email) {
              let existingEmail = await User.findOne({ where: { email: newUser.email } });
              if(existingEmail) {
                  existingEmail.googleId = profile.id;
                  existingEmail.avatar = newUser.avatar;
                  await existingEmail.save();
                  return done(null, existingEmail);
              }
            }
            user = await User.create(newUser);
            done(null, user);
          }
        } catch (err) {
          console.error(err);
          done(err, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
