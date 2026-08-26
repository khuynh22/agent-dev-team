const test = require('node:test');
const assert = require('node:assert');
const { split } = require('../src/split');

test('splits evenly when it divides', () => {
  assert.deepStrictEqual(split(900, 3), [300, 300, 300]);
});
