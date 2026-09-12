const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const seo = require('./seo.cjs');
const renderTrack = require('../track-view.js');
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, 'dist');
assert.equal(path.dirname(out), root);
assert.equal(path.basename(out), 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets/versioned'), { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
seo.writeDiscovery(out);
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'tracks.js'), 'utf8'), context);
const tracks = context.window.ARTIST_TRACKS;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const assets = {};
for (const file of ['app.js', 'tracks.js', 'track-view.js', 'styles.css', 'article.css']) {
  const content = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  const ext = path.extname(file);
  const name = `assets/versioned/${path.basename(file, ext)}.${hash(content).slice(0, 16)}${ext}`;
  fs.writeFileSync(path.join(out, name), content);
  // Legacy URLs remain available for already-open pages and are revalidated.
  fs.writeFileSync(path.join(out, file), content);
  assets[file] = name;
}
const htmlHashes = {};
for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  html = html.replace(/\uFEFF/g, '');
  if (html.includes('id="tracks"')) {
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    const visible = file === 'muzik.html' ? tracks : context.window.FEATURED_TRACK_IDS.map(id => tracks.find(track => track.id === id));
    html = html.replace(/(<div id="tracks"[^>]*>)<\/div>/, (_, opening) => opening + visible.map(track => renderTrack(track, tracks.indexOf(track))).join('') + '</div>');
  }
  html = seo.enrich(html, file, tracks);
  for (const [original, versioned] of Object.entries(assets)) {
    html = html.replaceAll(`="${original}"`, `="${versioned}"`);
  }
  for (const match of html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)) {
    const ref = match[1].split('#')[0];
    if (/^(https?:|mailto:)/.test(ref) || ref.endsWith('.html')) continue;
    assert.ok(fs.existsSync(path.join(out, ref)), `Missing built asset: ${ref}`);
  }
  fs.writeFileSync(path.join(out, file), html);
  htmlHashes[file] = hash(html);
}
fs.copyFileSync(path.join(root, 'staticwebapp.config.json'), path.join(out, 'staticwebapp.config.json'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.writeFileSync(path.join(out, 'build-info.json'), JSON.stringify({ commit, assets, htmlHashes }, null, 2) + '\n');
console.log(`Built dist: ${Object.keys(htmlHashes).length} HTML pages; content-hashed JS/CSS; source ${commit}.`);
