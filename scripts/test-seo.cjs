const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const config = require('../seo.config.json');
const context = require('node:vm').createContext({ window: {} });
require('node:vm').runInContext(fs.readFileSync(path.resolve(__dirname, '../tracks.js'), 'utf8'), context);
const tracks = context.window.ARTIST_TRACKS;
const root = path.resolve(__dirname, '../dist');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const hosting = JSON.parse(fs.readFileSync(path.join(root, 'staticwebapp.config.json'), 'utf8'));
const routes = hosting.routes.map(rule => rule.route.replace(/\/$/, ''));
assert.equal(new Set(routes).size, routes.length, 'Azure treats trailing-slash routes as duplicates');
assert.equal(hosting.trailingSlash, undefined, 'Keep Azure automatic extension removal off for canonical .html URLs');
for (const [file, page] of Object.entries(config.pages)) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, file + ': single H1');
  assert.ok(html.includes('<html lang="tr">'));
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1);
  assert.ok(html.includes(`rel="canonical" href="${config.origin}${page.path}"`));
  assert.ok(sitemap.includes(`<loc>${config.origin}${page.path}</loc>`));
  assert.ok(!html.includes('noindex'));
  for (const key of ['title','description','url','type','image','site_name','locale']) assert.equal([...html.matchAll(new RegExp(`property="og:${key}"`, 'g'))].length, 1);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const { '@graph': graph } = JSON.parse(scripts[0][1]);
  const person = graph.find(node => node['@type'] === 'Person');
  assert.equal(person['@id'], config.personId);
  assert.equal(person.name, config.name);
  assert.deepEqual(person.sameAs || [], config.sameAs);
  if (page.type === 'ProfilePage') assert.equal(graph.find(node => node['@type'] === page.type).mainEntity['@id'], config.personId);
  if (page.type === 'Article') assert.equal(graph.find(node => node['@type'] === 'Article').author['@id'], config.personId);
  for (const match of html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)) {
    const url = new URL(match[1], config.origin + page.path);
    if (url.origin !== config.origin) continue;
    const target = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    assert.ok(fs.existsSync(target), `${file}: broken link ${url.pathname}`);
  }
  if (file === 'muzik.html') {
    const recordings = graph.filter(node => node['@type'] === 'MusicRecording');
    assert.equal(recordings.length, tracks.length);
    for (const recording of recordings) assert.ok(html.includes(`id="${recording['@id'].split('#')[1]}"`));
    assert.equal([...html.matchAll(/class="track"/g)].length, tracks.length);
    for (const track of tracks.filter(track => track.spotifyUrl)) {
      assert.ok(html.includes(`href="${track.spotifyUrl}"`));
      assert.deepEqual(recordings.find(recording => recording.name === track.title).sameAs, [track.spotifyUrl]);
    }
  }
}
assert.equal([...sitemap.matchAll(/<loc>/g)].length, Object.keys(config.pages).length);
console.log('PASS: built metadata, canonical links, JSON-LD relationships, sitemap, internal assets and server-rendered music.');
