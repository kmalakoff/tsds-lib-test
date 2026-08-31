import assert from 'assert';
import { installGitRepo } from 'tsds-lib-test';

describe('exports .mjs', () => {
  it('defaults', () => {
    assert.equal(typeof installGitRepo, 'function');
  });
});
