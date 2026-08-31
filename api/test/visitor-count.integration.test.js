const assert = require('node:assert/strict');
const test = require('node:test');

const connectionString = process.env.VISITOR_TEST_CONNECTION_STRING;

test('counts each anonymous visitor once', { skip: !connectionString }, async () => {
  process.env.VISITOR_STORAGE_CONNECTION_STRING = connectionString;
  process.env.VISITOR_TABLE_NAME = `Counter${Date.now()}`;
  const { registerVisitor } = require('../src/functions/visitor-count');

  const first = await registerVisitor('00000000-0000-4000-8000-000000000001');
  const repeat = await registerVisitor('00000000-0000-4000-8000-000000000001');
  const second = await registerVisitor('00000000-0000-4000-8000-000000000002');

  assert.equal(first, 1);
  assert.equal(repeat, 1);
  assert.equal(second, 2);
});
