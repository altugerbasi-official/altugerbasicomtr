const fs = require('node:fs');
const path = require('node:path');
const config = require('../seo.config.json');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const plain = value => value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
function meta(html, key, value, attribute = 'name') {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, 'g');
  const tag = `<meta ${attribute}="${key}" content="${esc(value)}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', tag + '\n</head>');
}
function enrich(html, filename, tracks) {
  const page = config.pages[filename];
  if (!page) return html;
  const url = config.origin + page.path;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}">`);
  for (const [key, value, attr] of [
    ['description', page.description], ['author', config.name],
    ['robots', 'index, follow, max-image-preview:large'],
    ['og:title', page.title, 'property'], ['og:description', page.description, 'property'],
    ['og:url', url, 'property'], ['og:type', page.type === 'Article' ? 'article' : 'website', 'property'],
    ['og:site_name', config.name, 'property'], ['og:locale', 'tr_TR', 'property'],
    ['twitter:title', page.title], ['twitter:description', page.description]
  ]) html = meta(html, key, value, attr);
  // A site preview does not insert an illustration into an image-free article.
  const image = html.match(/<meta property="og:image" content="([^"]+)"/ )?.[1] || config.origin + '/assets/images/og.png';
  html = meta(html, 'og:image', image, 'property');
  html = meta(html, 'twitter:image', image);
  html = meta(html, 'twitter:card', 'summary_large_image');
  if (!html.includes('property="og:image:alt"')) html = meta(html, 'og:image:alt', config.name + ' — resmi web sitesi', 'property');
  if (config.googleSiteVerification) html = meta(html, 'google-site-verification', config.googleSiteVerification);
  if (config.bingSiteVerification) html = meta(html, 'msvalidate.01', config.bingSiteVerification);
  if (!html.includes('rel="manifest"')) html = html.replace('</head>', '<link rel="manifest" href="/site.webmanifest">\n</head>');
  const person = {
    '@type': 'Person', '@id': config.personId, name: config.name,
    url: config.origin + '/', image: config.origin + '/assets/images/altug-portrait.jpg',
    description: config.description,
    jobTitle: ['Müzisyen', 'Yazar', 'Oyuncu', 'Yaşam koçu', 'IT profesyoneli'],
    knowsAbout: ['Müzik', 'Şarkı yazarlığı', 'Tiyatro', 'Şiir', 'Yaşam koçluğu', 'Bilgi teknolojileri'],
    mainEntityOfPage: { '@id': config.origin + config.profilePath + '#webpage' }
  };
  if (config.sameAs.length) person.sameAs = config.sameAs;
  const website = {'@type':'WebSite','@id':config.origin+'/#website',name:config.name,url:config.origin+'/',inLanguage:'tr-TR',publisher:{'@id':config.personId},author:{'@id':config.personId}};
  const webPage = {'@type':page.type==='Article'?'WebPage':page.type,'@id':url+'#webpage',url,name:page.title,description:page.description,inLanguage:'tr-TR',isPartOf:{'@id':website['@id']},about:{'@id':config.personId}};
  const graph=[person,website,webPage];
  if(page.type==='ProfilePage') webPage.mainEntity={'@id':config.personId};
  if(page.type==='Article') {
    const headline=plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||page.title);
    const article={'@type':'Article','@id':url+'#article',headline,url,description:page.description,inLanguage:'tr-TR',author:{'@id':config.personId},publisher:{'@id':config.personId},mainEntityOfPage:{'@id':webPage['@id']}};
    if(html.includes('src="'+image.replace(config.origin+'/', '')+'"'))article.image=image;
    graph.push(article);webPage.mainEntity={'@id':article['@id']};
  }
  if(filename==='muzik.html') {
    const recordings=tracks.map(track=>({'@type':'MusicRecording','@id':url+'#'+track.id,name:track.title,url:url+'#'+track.id,byArtist:{'@id':config.personId},duration:`PT${Math.floor(track.duration/60)}M${Math.round(track.duration%60)}S`,image:config.origin+'/'+track.cover,encoding:{'@type':'AudioObject',contentUrl:config.origin+'/'+track.audio,encodingFormat:'audio/mpeg'}}));
    graph.push(...recordings);
    webPage.mainEntity={'@type':'ItemList',itemListElement:recordings.map((r,i)=>({'@type':'ListItem',position:i+1,item:{'@id':r['@id']}}))};
  }
  const json=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
  html=html.replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g,'');
  return html.replace('</head>',`<script type="application/ld+json" id="structured-data">${json}</script>\n</head>`);
}
function writeDiscovery(out) {
  const urls=Object.values(config.pages).map(page=>`  <url><loc>${config.origin}${page.path}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  for(const file of ['robots.txt','site.webmanifest'])fs.copyFileSync(path.join(__dirname,'..',file),path.join(out,file));
}
module.exports={enrich,writeDiscovery};
