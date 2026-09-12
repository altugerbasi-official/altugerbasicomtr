(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.renderArtistTrack = factory();
})(typeof window === 'object' ? window : this, function () {
  const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const time = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  const play = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
  return (track, index) => `<article class="track" id="${esc(track.id)}"><div class="track-art"><img src="${esc(track.cover)}" alt="${esc(track.title)} — Altuğ Erbaşı, single kapağı" width="1400" height="1400" loading="lazy"><button class="track-play" type="button" data-track="${index}" aria-label="${esc(track.title)} dinle">${play}</button></div><div class="track-topline"><span>ALTUĞ / SINGLE</span><span>${time(track.duration)}</span></div><h3>${esc(track.title)}</h3><p class="track-caption">${esc(track.caption)}</p><div class="track-actions"><button class="track-listen" type="button" data-track="${index}"><span>Şimdi dinle</span><span aria-hidden="true">↗</span></button>${track.spotifyUrl ? `<a class="track-spotify text-link" href="${esc(track.spotifyUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(track.title)} — Spotify’da dinle (yeni sekmede)">Spotify’da dinle <span aria-hidden="true">↗</span></a>` : ''}</div><noscript><audio controls preload="none" src="${esc(track.audio)}" aria-label="${esc(track.title)}"></audio></noscript></article>`;
});
