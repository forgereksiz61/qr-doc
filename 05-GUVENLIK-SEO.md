# Yerel prototipte güvenlik ve indekslenmeme

## İndekslenmeme

- Next.js root metadata `robots: { index: false, follow: false, ... }` uygulasın.
- Özellikle `/public/report/*` HTML yanıtlarında `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` başlığı bulunsun.
- PDF API yanıtında da aynı başlık bulunsun.
- Sitemap veya tüm raporları listeleyen sayfa ekleme.
- `robots.txt` ile rapor URL'lerine `Disallow` koymanın arama botlarının `noindex` talimatını görmesini engelleyebileceğini unutma.

**Önemli:** `noindex` SEO talimatıdır; URL bilen bir kişinin erişimini engellemez. Yerelde internete açılmamış uygulama zaten genel arama botlarınca erişilebilir değildir. İleride canlı yayın yapılırsa indekslenmeme yeniden test edilmelidir.

## Rapor verisi

- İlk aşama **yalnız sahte/kurgu PDF** ile sınanır.
- `local-data/`, `exports/`, `.env.local` `.gitignore`'da olmalı.
- PDF `public/` dizinine konulmamalı, yalnız sunucuda kontrollü aktarılmalı.
- `token` 32 hex değilse veya yoksa 404 döndür; dosya yolu gezinmesini engelle.
- PDF yanıtı `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` ve `Referrer-Policy: no-referrer` eklesin.
- PDF dosyasını ve içerdiği bilgileri konsol loglarına yazma.

## Gerçek raporlar için uyarı

Gelecekte sağlık raporları kullanılacaksa URL'yi bilen herkesin dosyaya erişebiliyor olması yeterli erişim kontrolü değildir. Yetkilendirme, hukukî dayanak, KVKK, depolama ve saklama/silme politikaları yayın öncesinde ayrı ele alınmalıdır. Bunları ilk aşamada uygulamaya başlama.
