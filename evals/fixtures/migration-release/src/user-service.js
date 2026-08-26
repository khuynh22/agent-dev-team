async function getUser(db, id) {
  const row = await db('users').where({ id }).first();
  return { id: row.id, name: `${row.first_name} ${row.last_name}` };
}

async function createUser(db, first, last) {
  return db('users').insert({ first_name: first, last_name: last });
}

module.exports = { getUser, createUser };
