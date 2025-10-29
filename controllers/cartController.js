const { Cart, CartItem, Tour, City, Hotel } = require('../models');

const cartController = {
  showCart: async (req, res) => {
    try {
      const cart = await Cart.findOne({
        where: { UserId: req.session.user.id },
        include: {
          model: Tour,
          through: { attributes: ['id', 'quantity'] },
          include: [City, Hotel]
        }
      });

      let total = 0;
      let items = [];
      
      if (cart && cart.Tours) {
        items = cart.Tours;
        total = items.reduce((sum, tour) => sum + (tour.price * tour.CartItem.quantity), 0);
      }

      res.render('cart', {
        items,
        total,
        user: req.session.user,
        title: 'Корзина'
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).render('error', { 
        message: 'Ошибка загрузки корзины',
        title: 'Ошибка'
      });
    }
  },

  addToCart: async (req, res) => {
    try {
      const { tourId } = req.params;
      const userId = req.session.user.id;

      let cart = await Cart.findOne({ where: { UserId: userId } });
      
      if (!cart) {
        cart = await Cart.create({ UserId: userId });
      }

      const cartItem = await CartItem.findOne({
        where: { CartId: cart.id, TourId: tourId }
      });

      if (cartItem) {
        await cartItem.update({ quantity: cartItem.quantity + 1 });
      } else {
        await CartItem.create({ CartId: cart.id, TourId: tourId });
      }

      res.json({ success: true, message: 'Тур добавлен в корзину' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Ошибка добавления в корзину' });
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const { itemId } = req.params;
      await CartItem.destroy({ where: { id: itemId } });
      res.json({ success: true, message: 'Тур удален из корзины' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Ошибка удаления из корзины' });
    }
  }
};

module.exports = cartController;