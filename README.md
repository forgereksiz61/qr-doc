# QR ile rapor görüntüleme — yerel prototip

Bu uygulama yalnızca bilgisayarınızda denemek içindir. `seed:demo` kurgu bir örnek PDF üretir. `import:pdfs` seçtiğiniz klasördeki PDF kopyalarını yerelde açar.

QR kodu bağlantıyı taşır. Adresi bilen kişi sayfayı açabilir; bu bir erişim kontrolü değildir.

## Gerekenler

- Node.js 20.9 veya daha yenisi

## Kurulum

```bash
npm install
copy .env.example .env.local
npm run seed:demo
npm run dev
```

`seed:demo` şunları oluşturur:

- `local-data/reports/6b7c84a0f725a903d6b6714a2cd538ef.pdf`
- `exports/demo-report-qr.png`

Terminalde rapor adresini yazar. İlk denemede bu adresi masaüstü tarayıcıda açın:

```text
http://localhost:3000/public/report/6b7c84a0f725a903d6b6714a2cd538ef
```

## Kendi PDF klasörü

`.env.local` içine kaynak klasörü yazın:

```text
PDF_IMPORT_DIR=C:\path\to\pdfs
```

Sonra:

```bash
npm run import:pdfs
```

Komut alt klasörler dahil bütün `.pdf` dosyalarını `local-data/reports/<token>.pdf` olarak kopyalar. Kaynak dosyalar değiştirilmez. Eşleşme dosya içeriğinin özetiyle tutulur; aynı dosya yeniden aktarılırsa token ve bağlantı aynı kalır. Bağlantı listesi `exports/report-links.csv` dosyasına yazılır. Bu liste ve PDF kopyaları Git’e girmez. Raporları listeleyen bir sayfa yoktur.

## Ne kontrol edilmeli

- Doğru `/public/report/<token>` adresi tarayıcının PDF görüntüleyicisini açar. Adres çubuğu bu URL'de kalır.
- Aynı dosya `/api/report/<token>/pdf` adresinden de açılır.
- Biçimi bozuk bir token, örneğin `/public/report/abc`, 404 döner.
- 32 küçük hex olup dosyası olmayan bir token da aynı 404 sayfasını verir.
- `http://localhost:3000/api/report/6b7c84a0f725a903d6b6714a2cd538ef/pdf` PDF yanıtı döner.

## QR

QR görseli `exports/demo-report-qr.png` dosyasındadır ve rapor sayfasına gider, doğrudan PDF adresine gitmez.

`localhost` telefonun kendisini gösterir. Bu QR telefonda açılmaz. Aynı Wi-Fi ağında denemek için:

1. Geliştirme sunucusunu `npm run dev -- --hostname 0.0.0.0` ile başlatın.
2. `.env.local` içindeki `SITE_URL` değerini `http://<bilgisayarın-LAN-adresi>:3000` yapın.
3. `npm run qr` ile QR görselini yeniden üretin.
4. Yalnızca kurgu raporu kullanın. Bu adres internete açık bir site değildir.

## Derleme kontrolü

```bash
npm run build
```
