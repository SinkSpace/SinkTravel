const { User } = require('../models');
const bcrypt = require('bcrypt');

const authController = {
  showLogin: (req, res) => {
    if (req.session.user) {
      return res.redirect('/');
    }
    res.render('login', { title: 'Вход в систему' });
  },

  showRegister: (req, res) => {
    if (req.session.user) {
      return res.redirect('/');
    }
    res.render('register', { title: 'Регистрация' });
  },

  register: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username && password) {
        await User.create({ username, password });
        res.redirect('/login');
      } else {
        res.status(400).render('register', { 
          error: 'Логин и пароль обязательны',
          title: 'Регистрация'
        });
      }
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).render('error', { 
        message: 'Ошибка регистрации',
        title: 'Ошибка'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });
      if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        };
        res.redirect('/');
      } else {
        res.status(400).render('login', { 
          error: 'Неверный логин или пароль',
          title: 'Вход в систему'
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).render('error', { 
        message: 'Ошибка входа',
        title: 'Ошибка'
      });
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/');
      }
    });
  }
};

module.exports = authController;