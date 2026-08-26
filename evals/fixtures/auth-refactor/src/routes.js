const { requireUser } = require('./middleware');
const { createSession } = require('./auth');

function register(app, db) {
  app.post('/login', (req, res) => {
    const user = db.findUser(req.body.email, req.body.password);
    if (!user) return res.status(401).json({ error: 'bad credentials' });
    res.json({ token: createSession(user.id) });
  });

  app.get('/me', requireUser, (req, res) => {
    res.json(db.getUser(req.userId));
  });

  app.get('/invoices/:id', requireUser, (req, res) => {
    res.json(db.getInvoice(req.params.id));
  });
}

module.exports = { register };
