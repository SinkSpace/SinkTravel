const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).send('Доступ запрещён');
    }
    next();
  };
};

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const setUserLocals = (req, res, next) => {
  res.locals.user = req.session.user;
  next();
};

module.exports = {
  requireRole,
  requireAuth,
  setUserLocals
};