const { verify } = require('./auth');

function requireUser(req, res, next) {
  const session = verify(req.headers['x-token']);
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  req.userId = session.userId;
  next();
}

module.exports = { requireUser };
