# Yerel test listesi

Aşama 1 testleri sadece **kurgu PDF** ile yürütülür.

| Test | Uygulama | Beklenen |
|---|---|---|
| T01 | `npm run dev` | Yerel sunucu başlar |
| T02 | Demo token URL'sini aç | Rapor sayfası ve PDF görünür |
| T03 | `GET /api/report/<demo-token>/pdf` | `200`, `application/pdf` |
| T04 | 32 hex dışı token | 404 |
| T05 | Doğru biçimli ama tanımsız token | 404 |
| T06 | PDF API yanıt başlıkları | `X-Robots-Tag`, `no-store`, `nosniff` |
| T07 | HTML metadata/başlık | `noindex` |
| T08 | Dar mobil ekran | Taşma yok, yeni sekmede açma bağlantısı var |
| T09 | QR PNG tarama | Üretilen URL'yi açar; telefonda localhost değil LAN IP kullanılmalı |
| T10 | `npm run build` | Derleme tamamlanır |
| T11 | Hassas dosyaları Git'e ekleme kontrolü | `local-data`, `exports`, `.env.local` izlenmez |

## Cursor'dan istenecek sonuç

Çalışan demo URL'sini, oluşturulan/çalıştırılan komutları, hangi testleri yaptığı ve hangilerini yapamadığını bildirsin. Ağ üzerinden telefonla test, manuel adım olarak kalabilir. **Tüm testlerden sonra durulsun; deploy yok.**
