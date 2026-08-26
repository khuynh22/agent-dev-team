const store = new Map();

function add(item) {
  store.set(item.id, item);
}

function page(offset, limit) {
  return [...store.values()].slice(offset, offset + limit);
}

function reset() {
  store.clear();
}

module.exports = { add, page, reset, store };
