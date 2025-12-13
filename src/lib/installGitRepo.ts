import spawn from 'cross-spawn-cb';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import type { CommandCallback, CommandOptions } from 'tsds-lib';
import { wrapWorker } from 'tsds-lib';
import url from 'url';
import type { InstallOptions } from '../types.ts';

const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const major = +process.versions.node.split('.')[0];
const dist = path.join(__dirname, '..', '..');
const version = major > 14 ? 'local' : 'stable';
const workerWrapper = wrapWorker(path.join(dist, 'cjs', 'lib', 'installGitRepo.js'));

function checkDirectoryExists(dest: string, callback: (err: Error | null, exists?: boolean) => void) {
  fs.stat(dest, (err) => {
    if (err && err.code === 'ENOENT') callback(null, false);
    else if (err) callback(err);
    else callback(null, true);
  });
}

function cloneRepository(repo: string, dest: string, callback) {
  const parentDir = path.dirname(dest);
  const repoName = path.basename(dest);
  const queue = new Queue(1);
  queue.defer(mkdirp.bind(null, dest));
  queue.defer(spawn.bind(null, 'git', ['clone', repo, repoName], { cwd: parentDir, stdio: 'inherit' }));
  queue.await(callback);
}

function updateRepository(dest: string, callback) {
  const queue = new Queue(1);
  queue.defer(spawn.bind(null, 'git', ['clean', '-fd'], { cwd: dest, stdio: 'inherit' }));
  queue.defer(spawn.bind(null, 'git', ['reset', '--hard', 'HEAD'], { cwd: dest, stdio: 'inherit' }));
  queue.defer(spawn.bind(null, 'git', ['pull', '--rebase'], { cwd: dest, stdio: 'inherit' }));
  queue.await(callback);
}

function installDependencies(dest: string, callback) {
  spawn('npm', ['install', '--silent'], { cwd: dest }, callback);
}

function cleanInstall(repo: string, dest: string, callback) {
  const queue = new Queue(1);
  queue.defer(safeRm.bind(null, dest));
  queue.defer(cloneRepository.bind(null, repo, dest));
  queue.defer(installDependencies.bind(null, dest));
  queue.await(callback);
}

function worker(repo: string, dest: string, options: CommandOptions | InstallOptions, callback: CommandCallback) {
  const installOptions = options as InstallOptions;

  if (installOptions.clean) {
    cleanInstall(repo, dest, callback);
  } else {
    checkDirectoryExists(dest, (err, exists) => {
      if (err) return callback(err);
      const queue = new Queue(1);
      if (!exists) {
        queue.defer(cloneRepository.bind(null, repo, dest));
        queue.defer(installDependencies.bind(null, dest));
      } else {
        queue.defer((cb) => {
          updateRepository(dest, (err2) => {
            if (err2) return cleanInstall(repo, dest, cb);
            installDependencies(dest, cb);
          });
        });
      }
      queue.await(callback);
    });
  }
}

export default function installGitRepo(repo: string, dest: string, options: CommandOptions | CommandCallback, callback?: CommandCallback): undefined {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  version !== 'local' ? workerWrapper(version, repo, dest, options, callback) : worker(repo, dest, options, callback);
}
