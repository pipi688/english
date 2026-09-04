import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inlineScript = html.match(/<script data-file-launch>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inlineScript, 'index.html must include the file-protocol launcher');

let redirectedTo = '';
const location = {
  protocol: 'file:',
  search: '',
  hash: '#library',
  replace(url) { redirectedTo = url; },
};
vm.runInNewContext(inlineScript, { location });
assert.equal(redirectedTo, 'http://localhost:8080/#library');
console.log('file protocol redirects to the local HTTP app');
