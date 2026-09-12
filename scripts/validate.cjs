const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
for (const file of ['app.js', 'tracks.js']) new vm.Script(read(file), { filename: file });
for (const page of ['index.html', 'muzik.html', 'vazgecmemek-her-zaman-guc-degildir.html']) for (const match of read(page).matchAll(/(?:src|href|poster)="([^"#]+)"/g)) {
  if (/^(https?:|mailto:)/.test(match[1])) continue;
  assert.ok(fs.existsSync(path.join(root, match[1].split('#')[0])), `Missing asset: ${match[1]}`);
}
const context = vm.createContext({ window: {} });
vm.runInContext(read('tracks.js'), context);
const tracks = context.window.ARTIST_TRACKS;
assert.equal(new Set(tracks.map(track => track.id)).size, tracks.length);
const featured = context.window.FEATURED_TRACK_IDS;
assert.equal(featured.length, 3);
assert.equal(new Set(featured).size, featured.length);
for (const id of featured) assert.ok(tracks.some(track => track.id === id), `Unknown featured track: ${id}`);
for (const track of tracks) {
  for (const file of [track.audio, track.cover]) assert.ok(fs.statSync(path.join(root, file)).size > 1000, `Empty asset: ${file}`);
  assert.ok(track.duration > 0);
}
assert.ok(html.includes('mailto:altuglove@gmail.com'));
assert.ok(html.includes('https://altugerbasi.com.tr/assets/images/og.png'));
console.log(`Static site validated: ${tracks.length} songs, media assets, scripts, contact and social metadata.`);
