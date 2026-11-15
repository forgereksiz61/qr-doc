# Yerel çalıştırma ve ilk görsel kontrol

## Hedef

Bu dosya **deploy rehberi değildir**. Sadece bilgisayardaki ilk demo için kullanılacaktır.

## Başlangıç

1. Cursor kodu tamamladıktan sonra `npm install`.
2. `.env.example` → `.env.local`; ilk test için `SITE_URL=http://localhost:3000`.
3. `npm run seed:demo` ile kişisel veri içermeyen bir test PDF'si, token ve gerekiyorsa test QR oluştur.
4. `npm run dev`.
5. Terminalin verdiği rapor URL'sini masaüstü tarayıcıda aç.
6. Bilinen token → PDF görünmeli; yanlış token → 404; `/api/report/<token>/pdf` → PDF yanıtı.

> Cursor, script adlarını `README.md` içinde açıkça belirtmeli; mümkünse yukarıdaki adları korumalı.

## Telefonla gerçek QR kontrolü (isteğe bağlı, sonraki manuel test)

- Telefon ve bilgisayar aynı Wi-Fi'ya bağlı olsun.
- `npm run dev -- --hostname 0.0.0.0` ile geliştirme sunucusunu LAN üzerinden dinlet.
- Bilgisayarın yerel IP adresini belirle ve `SITE_URL=http://192.168.x.y:3000` biçiminde değiştir.
- QR'yi yeni `SITE_URL` ile yeniden oluştur.
- Telefonda QR okut; yerel ağ erişimi engellenmişse güvenlik duvarını kontrol et.
- Bu bağlantı internete dağıtılmış site değildir, test içindir. Yalnız kurgu rapor kullan.

## Durdurma koşulu

Rapor sayfası görünüp PDF açıldıktan ve temel testler geçtikten sonra Cursor **durmalı**. Vercel, DNS, domain, bulut depolama veya canlı yayın ayarı önermeye/uygulamaya geçmemeli. Bir sonraki adımı kullanıcı seçecek.
