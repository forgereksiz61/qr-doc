# MVP gereksinimleri — aşama 1

## Zorunlu (P0)

| Kimlik | Beklenti | Kabul ölçütü |
|---|---|---|
| R01 | Dinamik rapor sayfası | `/public/report/[token]` açılır |
| R02 | PDF servis endpoint'i | `/api/report/[token]/pdf` PDF akışı döndürür |
| R03 | Yerel ve gizli dosya | `local-data/reports/<token>.pdf` içinden server-side okunur |
| R04 | Token güvenliği | Tam 32 küçük hex; geçersiz/bilinmeyen 404 |
| R05 | Mobil sayfa | PDF görüntüleme ve yeni sekmede açma bağlantısı |
| R06 | Test raporu | Gerçek kişi bilgisi içermeyen bir örnek PDF ve token |
| R07 | QR üretimi | En az bir test QR PNG/SVG, geçerli rapor sayfası URL'sine işaret eder |
| R08 | Noindex | HTML metadata ve HTML/PDF HTTP başlıkları |
| R09 | Yerel çalıştırma | `npm run dev` ve net README talimatı |

## İleri aşamaya bırakılacaklar (P1/P2)

- PDF'yi kullanıcıdan alma / yönetme aracı ve toplu rapor ekleme
- Alternatif `/web/RaporDogrulama.aspx?op=RAPORKOD=...` yoluyla **kendi** tokenlarımızı çözümleme
- Domain/hosting/deploy, yetkilendirme ve üretim güvenliği
- Kullanıcı açıkça istemedikçe bunların hiçbirini şimdiden kodlama

## Kesinlik sınırı

Arama motoru `noindex` talimatı aramada görünmeme hedefini destekler; garanti veya erişim koruması sağlamaz. QR yalnızca bağlantıyı taşır. Gerçek hasta raporları bu prototipte kullanılmamalıdır.
