# QR ile PDF görüntüleme — 1. aşama (yerel prototip)

## Şu anda ne yapıyoruz?

Kullanıcı PDF üzerindeki **kendi QR kodumuzu** okuttuğunda şu biçimde bir sayfa açılacak:

```text
http://localhost:3000/public/report/6b7c84a0f725a903d6b6714a2cd538ef
```

Bu örnekteki `localhost` yalnızca bilgisayarda test içindir. Telefonla QR tarama testinde ayrıca aynı Wi-Fi ağından erişilebilen bilgisayarın LAN IP'si kullanılabilir. Henüz gerçek domain veya internete yayın yoktur.

İlgili sayfa yerel olarak saklanan **kurgu PDF dosyasını** gömecek; geçersiz kodda 404 dönecek. Basit, temiz, Türkçe ve mobil uyumlu görünüm yeterlidir.

## Kesin sınır

**Bu aşamada yapılmayacaklar:** Vercel/deploy, özel domain, DNS, gerçek rapor yükleme, bulut depolama, kullanıcı girişi, panel, veritabanı, mevcut kurum kodlarıyla doğrulama entegrasyonu. Bunlar kullanıcı açıkça istediğinde ayrıca değerlendirilecek.

## Başarı tanımı

1. `npm run dev` ile yerelde çalışır.
2. Test PDF'si bir token ile `/public/report/<token>` sayfasında açılır.
3. `GET /api/report/<token>/pdf` PDF dosyasını sunar.
4. QR kodu bu URL'ye götürür (telefon testinde LAN adresi şart).
5. Geçersiz token 404 üretir.
6. HTML ve PDF indekslenmeme başlıklarına sahiptir.
7. İlk gösterimden sonra Cursor **durur**, sonraki aşamalara geçmez.

## Belgeleri okuma sırası

`AGENTS.md` → `01-GEREKSINIMLER.md` → `02-MIMARI.md` → `03-URL-VE-QR.md` → `04-ARAYUZ.md` → `05-GUVENLIK-SEO.md` → `06-YEREL-CALISTIRMA.md` → `07-CURSOR-ANA-PROMPT.md` → `09-TEST-PLANI.md`.
