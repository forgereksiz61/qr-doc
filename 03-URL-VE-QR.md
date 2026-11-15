# URL ve QR taslağı — yalnızca yerel test

## 1. Asıl sayfa

```text
http://localhost:3000/public/report/<32-haneli-hex-token>
```

Örnek test tokenı: `6b7c84a0f725a903d6b6714a2cd538ef` (gerçek veri değil). PDF bu sayfanın içine gömülür; QR doğrudan PDF endpoint'ini değil bu sayfayı açar.

## 2. PDF endpoint'i

```text
GET http://localhost:3000/api/report/<token>/pdf
```

Dosya yalnız sunucunun `local-data/reports/` klasöründen okunur.

## 3. QR testi

- **Aynı bilgisayarda**: `SITE_URL=http://localhost:3000` kullan, QR'yi bir QR okuyucusuyla denemek yerine tarayıcıda URL'yi açarak ilk testi gerçekleştir.
- **Telefonla aynı Wi-Fi ağında**: Next.js `0.0.0.0` üzerinde dinlemeli; `SITE_URL=http://<BILGISAYARIN_LAN_IP_ADRESI>:3000` ile QR yeniden üretilmeli. Telefonun `localhost` adresi kendi telefonunu ifade eder. İşletim sistemi güvenlik duvarı LAN erişimine izin vermelidir.
- Gerçek raporlarla HTTP/LAN testi yapma; yalnızca kurgu veriler kullan.
- QR çıktısı `exports/` dizinine kaydedilsin; repoya girmez.

## 4. İleriki aşama: alternatif URL

Örnek kurumun gönderdiği bağlantı biçimi:

```text
https://www.acibademlabmed.com.tr/web/RaporDogrulama.aspx?op=RAPORKOD=...
```

Daha sonra **kendi alan adımızda** aynı URL biçimini destekleyebiliriz. Bu aşamada route'u **yazma**. Orijinal kurumun domainini yönlendiremeyiz; o kurumun gerçek kodunu doğrulayamıyoruz. Kendi oluşturduğumuz tokenla ilişkili yerel kayıt olmadan üçüncü taraf raporu varmış gibi sunmayacağız.

## 5. Mevcut QR'lar

Orijinal QR başka bir domain içeriyorsa kendi sitemize yönlendirmek için PDF'deki QR'nin yeniden üretilmesi gerekir. Bu prototip PDF dosyasını düzenlemez; sadece test QR üretir.
