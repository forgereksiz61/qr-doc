# Yerel mimari — mümkün olan en az parça

## Akış

```text
QR / tarayıcı
    ↓
/public/report/<token>         Next.js sayfası
    ↓ iframe
/api/report/<token>/pdf       Next.js Route Handler
    ↓ dosyayı sunucuda okur
local-data/reports/<token>.pdf  Git dışı yerel klasör
```

PDF dosyasını `public/` içine koyma. `local-data/reports/` yalnız geliştirme ortamında kullanılan, web kökünden doğrudan yayımlanmayan klasördür.

## Önerilen dizinler

```text
app/
  layout.tsx
  page.tsx
  public/report/[token]/page.tsx
  api/report/[token]/pdf/route.ts
  not-found.tsx
lib/
  report-token.ts
  local-report-storage.ts
scripts/
  seed-demo.ts
  make-qr.ts
local-data/reports/       # .gitignore; dosyalar burada
exports/                  # .gitignore; QR burada
AGENTS.md
README.md
.env.example
```

Yalnızca ihtiyaç varsa ek dosya aç. Otomatik test PDF'si üretmek için az bağımlılıklı yöntem seç; kişisel veri barındırmayan kurgu belge oluştur.

## Güvenlik ve teknik seçimler

- `token` için `^[0-9a-f]{32}$` kullan; tokenlar üretileceğinde `crypto.randomBytes(16).toString('hex')` uygula.
- Yol oluşturma yalnız bu doğrulamadan sonra `path.join(DATA_DIR, `${token}.pdf`)` ile yapılır. İstemciden dosya yolu almama.
- PDF endpoint'i `Content-Type: application/pdf`, `Content-Disposition: inline`, `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` döndürsün.
- `fs` erişimini server-only tut. Dosya yoksa 404; beklenmedik arızada 500, detay sızdırma.
- `robots` metadata sayfa ve PDF'yi kapsamalı; HTML sayfalarında `noindex` bulunmalı.
- Güncel Next.js'in App Router params/route handler API'sine uygun davran.

## Kapsam dışı

Private Blob, Vercel, S3, veritabanı, auth, upload endpoint'i, e-posta, yönetim paneli ve canlı dağıtım yok.
