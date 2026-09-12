# altugerbasicomtr
Altuğ Erbaşı Official Site — sanatçı sitesi.

`npm run dev` starts the local preview; `npm run build` validates the static site and its assets.

Production builds are written to `dist/`. HTML references content-hashed JS/CSS in `assets/versioned/`; HTML and legacy entry points revalidate on every request. The deployment workflow builds and archives this exact directory before uploading it to Azure. `build-info.json` identifies the source commit and SHA-256 hashes of the deployed HTML. Generated `dist/` is not committed.

## Müzik

Ana sayfadaki üç şarkı ve sıraları `tracks.js` içindeki `FEATURED_TRACK_IDS` listesinden seçilir. `ARTIST_TRACKS` tüm arşivi tutar; `muzik.html` hepsini kompakt liste olarak gösterir. Bu sayfalar arasındaki site içi geçişlerde oynatıcı ve çalan şarkı korunur.

Şarkılar `tracks.js` dosyasında tanımlıdır. MP3 dosyaları `assets/audio`, kapaklar `assets/images` içindedir. Orijinal WAV ve fotoğraflar değiştirilmez.

Bir şarkı YouTube'da yayımlandığında ilgili kaydın `youtubeUrl` alanına HTTPS video adresini yazın. Dinleme düğmeleri bu adresi yeni sekmede açar ve site içi sesi durdurur. Otomatik parça geçişi yeni sekme açmaz; ziyaretçiye YouTube bağlantısını gösterir. YouTube görüntüleme sayımı platformun kendi kurallarına bağlıdır.

Canlı yayın mevcut Azure Static Web Apps GitHub Actions akışı ile yapılır.
