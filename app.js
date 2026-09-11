(() => {
  'use strict';
  const tracks = window.ARTIST_TRACKS;
  const time = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  const playIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
  document.querySelector('#tracks').innerHTML = tracks.map((track, index) => `<article class="track" id="${track.id}"><div class="track-art"><img src="${track.cover}" alt="${track.title} — Altuğ, single kapağı" width="1400" height="1400" loading="lazy"><button class="track-play" type="button" data-track="${index}" aria-label="${track.title} dinle">${playIcon}</button></div><div class="track-topline"><span>ALTUĞ / SINGLE</span><span>${time(track.duration)}</span></div><h3>${track.title}</h3><p class="track-caption">${track.caption}</p><button class="track-listen" type="button" data-track="${index}"><span>Şimdi dinle</span><span aria-hidden="true">↗</span></button></article>`).join('');
  const pauseIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
  const previousIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h2v14H5zm14 0v14L8 12z"/></svg>';
  const nextIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 5h2v14h-2zM5 5l11 7-11 7z"/></svg>';
  const volumeIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-5v16l-5-5H3z"/><path d="M16 8q5 4 0 8M19 5q8 7 0 14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  document.querySelector('#player-root').innerHTML = `<section class="player" aria-label="Müzik oynatıcı" hidden><div class="now-playing"><img id="player-cover" alt="" width="52" height="52"><div><strong id="player-title"></strong><span id="player-artist">Altuğ</span></div></div><div class="player-center"><div class="transport"><button class="icon-button" id="previous" type="button" aria-label="Önceki şarkı">${previousIcon}</button><button class="icon-button main-play" id="toggle" type="button" aria-label="Dinle">${playIcon}</button><button class="icon-button" id="next" type="button" aria-label="Sonraki şarkı">${nextIcon}</button></div><div class="timeline"><time id="elapsed">0:00</time><input id="seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Şarkıda konum" disabled><time id="duration">0:00</time></div></div><div class="player-right"><p class="player-status" id="status" role="status" aria-live="polite"></p><button class="icon-button" id="mute" type="button" aria-label="Sesi kapat" aria-pressed="false">${volumeIcon}</button><input id="volume" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Ses seviyesi"></div><a id="youtube-link" class="youtube-link" target="_blank" rel="noopener noreferrer" hidden>YouTube’da dinle ↗</a><audio id="audio" preload="none"></audio></section>`;
  const $ = selector => document.querySelector(selector);
  const audio = $('#audio');
  const seek = $('#seek');
  let current = -1;
  let request = 0;
  let scrubbing = false;
  audio.volume = 0.8;
  function youtubeUrl(track) {
    if (!track.youtubeUrl) return '';
    try {
      const url = new URL(track.youtubeUrl);
      return url.protocol === 'https:' && ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname) ? url.href : '';
    } catch { return ''; }
  }
  function status(message) {
    $('#status').textContent = message;
    $('#player-artist').textContent = message || 'Altuğ';
  }
  function sync() {
    const playing = !audio.paused && !audio.ended;
    $('#toggle').innerHTML = playing ? pauseIcon : playIcon;
    $('#toggle').setAttribute('aria-label', playing ? 'Duraklat' : 'Dinle');
    $('#toggle').setAttribute('aria-pressed', String(playing));
    tracks.forEach((track, index) => {
      const active = current === index && playing;
      const card = document.getElementById(track.id);
      card.classList.toggle('is-playing', active);
      card.querySelector('.track-play').innerHTML = active ? pauseIcon : playIcon;
      card.querySelectorAll('[data-track]').forEach(button => {
        button.setAttribute('aria-label', `${track.title} ${active ? 'duraklat' : youtubeUrl(track) ? 'YouTube’da dinle' : 'dinle'}`);
        button.setAttribute('aria-pressed', String(active));
      });
      card.querySelector('.track-listen span').textContent = active ? 'Çalıyor · Duraklat' : youtubeUrl(track) ? 'YouTube’da dinle' : 'Şimdi dinle';
    });
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }
  function progress() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : (tracks[current]?.duration || 0);
    $('#elapsed').textContent = time(audio.currentTime || 0);
    $('#duration').textContent = time(duration);
    if (!scrubbing) seek.value = duration ? audio.currentTime / duration * 100 : 0;
    seek.setAttribute('aria-valuetext', `${time(audio.currentTime || 0)} / ${time(duration)}`);
  }
  async function start(index, userInitiated = true) {
    const ticket = ++request;
    const track = tracks[index];
    if (!track) return;
    const external = youtubeUrl(track);
    if (current !== index) {
      audio.pause();
      current = index;
      $('#player-title').textContent = track.title;
      $('#player-cover').src = track.cover;
      seek.value = 0;
      seek.disabled = true;
      $('#elapsed').textContent = '0:00';
      $('#duration').textContent = time(track.duration);
      if (!external) { audio.src = track.audio; audio.load(); }
      else { audio.removeAttribute('src'); audio.load(); }
      if ('mediaSession' in navigator && 'MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: 'Altuğ Erbaşı', artwork: [{ src: new URL(track.cover, location.href).href, type: 'image/jpeg' }] });
    }
    $('.player').hidden = false;
    document.body.classList.add('has-player');
    $('#youtube-link').hidden = !external;
    if (external) {
      audio.pause();
      $('#youtube-link').href = external;
      status('YouTube’da yayında');
      if (userInitiated) window.open(external, '_blank', 'noopener,noreferrer');
      sync();
      return;
    }
    status('Yükleniyor…');
    if (audio.error) audio.load();
    try {
      await audio.play();
      if (ticket === request) { status(''); sync(); }
    } catch (error) {
      if (ticket !== request || error.name === 'AbortError') return;
      status('Açılamadı. Tekrar dinleye bas.');
      sync();
    }
  }
  function toggle(index = current) {
    if (index < 0) index = 0;
    if (index === current && !audio.paused) { request++; audio.pause(); status(''); }
    else start(index);
  }
  document.querySelectorAll('[data-track]').forEach(button => button.addEventListener('click', () => toggle(Number(button.dataset.track))));
  $('#toggle').addEventListener('click', () => toggle());
  const next = () => start((current + 1) % tracks.length);
  const previous = () => start((current - 1 + tracks.length) % tracks.length);
  $('#next').addEventListener('click', next);
  $('#previous').addEventListener('click', previous);
  audio.addEventListener('loadedmetadata', () => { seek.disabled = !Number.isFinite(audio.duration); progress(); });
  audio.addEventListener('timeupdate', progress);
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('waiting', () => status('Yükleniyor…'));
  audio.addEventListener('playing', () => status(''));
  audio.addEventListener('error', () => { if (audio.hasAttribute('src')) { status('Açılamadı. Tekrar dinleye bas.'); sync(); } });
  audio.addEventListener('ended', () => {
    if (current < tracks.length - 1) start(current + 1, false);
    else { status('Dinlediğin için teşekkürler.'); sync(); }
  });
  seek.addEventListener('input', () => {
    scrubbing = true;
    if (Number.isFinite(audio.duration)) $('#elapsed').textContent = time(Number(seek.value) / 100 * audio.duration);
  });
  seek.addEventListener('change', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 100 * audio.duration;
    scrubbing = false;
    progress();
  });
  $('#volume').addEventListener('input', event => { audio.volume = Number(event.target.value); audio.muted = audio.volume === 0; });
  $('#mute').addEventListener('click', () => { audio.muted = !audio.muted; });
  audio.addEventListener('volumechange', () => {
    $('#mute').setAttribute('aria-pressed', String(audio.muted));
    $('#mute').setAttribute('aria-label', audio.muted ? 'Sesi aç' : 'Sesi kapat');
    $('#volume').value = audio.muted ? 0 : audio.volume;
    $('#mute').style.opacity = audio.muted ? '.45' : '1';
  });
  if ('mediaSession' in navigator) {
    const actions = { play: () => start(current < 0 ? 0 : current), pause: () => audio.pause(), previoustrack: previous, nexttrack: next, seekto: detail => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, detail.seekTime)); } };
    Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch {} });
  }
  $('#year').textContent = new Date().getFullYear();
  sync();
  async function loadVisitors() {
    try {
      let id = document.cookie.split('; ').find(item => item.startsWith('altug_visitor='))?.split('=').slice(1).join('=');
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        document.cookie = `altug_visitor=${encodeURIComponent(id)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
      } else id = decodeURIComponent(id);
      const response = await fetch('/api/visitor-count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId: id }) });
      if (!response.ok) return;
      const { count } = await response.json();
      if (Number.isFinite(count) && count > 0) $('#visitor-label').textContent = `${new Intl.NumberFormat('tr-TR').format(count)} kez yollarımız kesişti.`;
    } catch { /* The site and music remain available if the visitor service is offline. */ }
  }
  loadVisitors();
})();
