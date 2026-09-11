# altugerbasicomtr
Altuğ Erbaşı Official Site — sanatçı sitesi.

`npm run dev` starts the local preview; `npm run build` validates the static site and its assets.

## Müzik

Şarkılar `tracks.js` dosyasında tanımlıdır. MP3 dosyaları `assets/audio`, kapaklar `assets/images` içindedir. Orijinal WAV ve fotoğraflar değiştirilmez.

Bir şarkı YouTube'da yayımlandığında ilgili kaydın `youtubeUrl` alanına HTTPS video adresini yazın. Dinleme düğmeleri bu adresi yeni sekmede açar ve site içi sesi durdurur. Otomatik parça geçişi yeni sekme açmaz; ziyaretçiye YouTube bağlantısını gösterir. YouTube görüntüleme sayımı platformun kendi kurallarına bağlıdır.

Canlı yayın mevcut Azure Static Web Apps GitHub Actions akışı ile yapılır.
