const assert = require('assert');
const { installGitRepo } = require('tsds-lib-test');

describe('exports .cjs', () => {
  it('defaults', () => {
    assert.equal(typeof installGitRepo, 'function');
  });
});
