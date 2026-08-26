const sessions = new Map();

function createSession(userId) {
  const token = String(Math.random()).slice(2);
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

function verify(token) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > 3600 * 1000) return null;
  return session;
}

module.exports = { createSession, verify };
