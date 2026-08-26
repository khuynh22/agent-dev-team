const users = [{ id: 1, email: 'a@example.com', password: 'hunter2', name: 'Ada' }];
const invoices = [{ id: '7', ownerId: 1, amount: 100 }];

module.exports = {
  findUser: (email, password) => users.find((u) => u.email === email && u.password === password),
  getUser: (id) => users.find((u) => u.id === id),
  getInvoice: (id) => invoices.find((i) => i.id === id),
};
