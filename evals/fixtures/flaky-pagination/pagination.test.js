const test = require('node:test');
const assert = require('node:assert');
const { add, page, store } = require('./pagination');

test('first page returns two items', () => {
  add({ id: 'a' });
  add({ id: 'b' });
  add({ id: 'c' });
  assert.strictEqual(page(0, 2).length, 2);
});

test('second page returns the remainder', () => {
  add({ id: 'd' });
  assert.deepStrictEqual(page(2, 2).map((i) => i.id), ['c', 'd']);
});

test('empty store returns nothing', () => {
  assert.deepStrictEqual(page(0, 10), []);
});
