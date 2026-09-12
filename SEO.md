# Arama ve kişisel kimlik yapılandırması

Resmi origin: https://altugerbasi.com.tr/ · Kişi kimliği: https://altugerbasi.com.tr/#person

## İçerik ve build

`seo.config.json` tüm indexlenebilir sayfaların URL, başlık ve açıklamalarını tanımlar. Mevcut `.html` URL yapısı korunur; ana sayfanın canonical adresi `/` olur. `/altug-erbasi.html` resmi biyografidir.

`npm run build` kaynak doğrulamasını, statik HTML üretimini ve SEO regresyon kontrollerini çalıştırır. `scripts/seo.cjs` metadata ve JSON-LD üretir. Sitemap yalnızca config içindeki beş canonical sayfayı içerir; uydurma yayın/güncelleme tarihleri kullanılmaz. Yeni yazı eklerken config'e de ekleyin. Kaynak HTML başlıklarını da aynı içerikle güncel tutun; production metadata için config esas alınır.

Müzik kartları `track-view.js` üzerinden hem build sırasında hem tarayıcıda aynı markup ile oluşturulur. Böylece şarkılar JavaScript gerektirmeden okunabilir ve dinlenebilir. Sayfa geçişlerinde canonical, sosyal metadata ve JSON-LD güncellenir. Mevcut tasarım ve sürekli müzik oynatıcısı korunur.

Person, WebSite, ProfilePage, WebPage/CollectionPage, Article ve MusicRecording kullanılır. Yazar/yayıncı/sanatçı referansları aynı Person kimliğine bağlanır. Görselsiz makaleye gövde görseli eklenmez; sosyal paylaşımda mevcut site görseli kullanılır. Article.image yalnızca makalede bulunan görsel için yazılır.

HTML revalidation (`no-cache, max-age=0, must-revalidate`), hash içeren JS/CSS için bir yıllık immutable cache korunur. `build-info.json` deploy commit ve HTML SHA-256 değerlerini içerir.

## Eksik dış bilgiler

`sameAs` bilinçli olarak boş. Kullanıcı tarafından doğrulanmış resmi YouTube, Spotify, Apple Music, Instagram, LinkedIn veya diğer profil adresleri sağlandığında ekleyin. Arama sonuçlarından kişi benzerliğine dayanarak profil eklemeyin.

`googleSiteVerification` ve `bingSiteVerification` isteğe bağlı kamuya açık HTML doğrulama değerleridir. Hesap parolası, OAuth token veya başka kimlik bilgisi buraya yazılmaz. Domain doğrulaması için DNS TXT yöntemi tercih edilir; değer Search Console'dan alınır.

## Search Console ve Bing

1. Search Console'da Domain property olarak `altugerbasi.com.tr` ekleyin.
2. Sağlanan TXT kaydını DNS köküne ekleyin; yayılım sonrası Doğrula'yı kullanın.
3. `https://altugerbasi.com.tr/sitemap.xml` gönderin.
4. Ana URL'yi URL Denetleme'de canlı test edip dizine eklenmesini isteyin.
5. `/altug-erbasi.html` için aynı işlemi yapın; makaleleri ve müzik sayfasını da denetleyin.
6. Bing Webmaster Tools'da doğrulanmış Search Console sitesini içe aktarın veya ayrı doğrulayın. Sitemap ve URL denetimini kontrol edin.

## DNS ve hosting kontrolü

İlk denetimde yalnızca apex alan adı Azure'a bağlıydı; `www.altugerbasi.com.tr` DNS çözümlemiyordu. DNS erişimi olmadan bu düzeltilemez. İstenirse `www` CNAME kaydını `jolly-pebble-0592a6503.6.azurestaticapps.net` hedefine ekleyin, Azure Static Web Apps Custom domains ekranında www alan adını doğrulayıp SSL hazır olduktan sonra apex'i varsayılan domain yapın. Azure'ın varsayılan domain özelliği diğer bağlı domainleri ona yönlendirir. DNS ve Azure doğrulaması tamamlanmadan www'nin çalıştığını varsaymayın.

## Doğrulama ve sınırlar

- Yerel production önizleme: `node scripts/preview.cjs --dist`.
- API testi: `npm test --prefix api`; ortam gerektiren entegrasyon testi ilgili değişkenler olmadığında atlanır.
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [OpenAI botları](https://developers.openai.com/api/docs/bots): OAI-SearchBot arama botudur; ChatGPT-User kullanıcı tarafından başlatılan erişimdir ve robots kuralları her durumda uygulanmayabilir.
- [Google AI optimizasyon rehberi](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): Google Search llms.txt dosyasını kullanmaz. Kanıtlanmış standart taranabilirlik, içerik ve yapılandırılmış veri iyileştirmeleri tercih edildi.
- [Bing Search Console içe aktarma](https://blogs.bing.com/webmaster/september-2019/Import-sites-from-Search-Console-to-Bing-Webmaster-Tools)

JSON-LD sözdizimi ve referans testleri, canlı zengin sonuç uygunluğu veya indekslenme garantisi değildir. Core Web Vitals saha ölçümleri Search Console'da yeterli trafik verisiyle ayrıca takip edilmelidir.
