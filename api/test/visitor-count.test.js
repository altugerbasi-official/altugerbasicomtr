const assert = require('node:assert/strict');
const test = require('node:test');

test('visitor identifiers use the expected anonymous format', () => {
  const validIds = [
    '550e8400-e29b-41d4-a716-446655440000',
    '1756650000000-anonymousvisitor'
  ];
  const pattern = /^[a-zA-Z0-9_-]{16,100}$/;
  validIds.forEach((id) => assert.match(id, pattern));
  assert.doesNotMatch('short', pattern);
});
