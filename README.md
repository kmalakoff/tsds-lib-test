# tsds-lib-test

Clone or update a library repository, then run `npm install` in the checkout. It is a helper used by [ts-dev-stack](https://www.npmjs.com/package/ts-dev-stack) tests.

## Install

```sh
npm install tsds-lib-test
```

## Use

```js
const { installGitRepo } = require('tsds-lib-test');
const [repo, destination] = process.argv.slice(2);

if (!repo || !destination) {
  throw new Error('Usage: node install-repo.js <repository> <destination>');
}

installGitRepo(repo, destination, { clean: true }, (error) => {
  if (error) throw error;
  console.log('Repository installed');
});
```

Pass the Git repository URL or path as `repo` and a disposable checkout path as
`destination`. Existing checkouts are cleaned, reset, and updated, so local
changes in the destination are discarded. `clean: true` removes and reclones the
checkout. The function also supports a Promise form when the callback is omitted.
