const { User, Tour, City, Hotel } = require('../models');
const bcrypt = require('bcrypt');

const profileController = {
  showProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.session.user.id, {
        attributes: { exclude: ['password'] }
      });
      
      const userTours = await Tour.findAll({
        where: { ClientId: req.session.user.id },
        include: [City, Hotel]
      });

      res.render('profile', {
        user,
        tours: userTours,
        title: 'Мой профиль'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки профиля',
        title: 'Ошибка'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { username, currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.session.user.id);

      let updateData = { username };

      if (newPassword) {
        if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
          return res.status(400).render('profile', {
            user,
            error: 'Неверный текущий пароль',
            title: 'Мой профиль'
          });
        }
        updateData.password = newPassword;
      }

      await user.update(updateData);
      res.redirect('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).render('error', { 
        message: 'Ошибка обновления профиля',
        title: 'Ошибка'
      });
    }
  }
};

module.exports = profileController;