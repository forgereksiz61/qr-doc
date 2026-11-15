# Cursor geliştirme kuralları — YALNIZCA YEREL MVP

## Çalışma sınırı

- Bu proje şu anda yalnızca **yerel prototip** aşamasındadır.
- **Deploy, Vercel kurulumu, domain/DNS, cloud storage, CI/CD, production ve canlı yayın işlemleri YASAKTIR.** Kullanıcı ayrıca onay vermeden bunlara geçme; bunlar için kod, yapılandırma, otomatik eylem veya açıklama oluşturma.
- Kullanıcı adım adım incelemek istiyor. Yalnızca istenen aşamayı bitir ve **dur**. Gelecek aşamaları önceden uygulama.
- İlk hedef: bilgisayarda bir örnek PDF'nin `/public/report/<token>` yoluyla görüntülenmesi.
- Gerçek sağlık verisi yükleme; yalnızca kurgu/test PDF'si kullan.

## Teknik kurallar

1. Next.js App Router, React, TypeScript strict, Tailwind CSS kullan.
2. PDF'leri `public/` altında değil, Git dışında tutulacak `local-data/reports/` içinde tut. Sadece sunucu route handler dosyayı kontrollü aktarabilsin.
3. `token` tam 32 küçük hex karakterden oluşsun; dosya yolu yalnız doğrulanmış tokendan türetilsin. Kullanıcıdan path veya URL kabul etme.
4. HTML ve PDF yanıtlarına `noindex` başlıkları; PDF yanıtlarına `no-store` uygula.
5. QR ile açılma, URL'yi elle yazan kişiye karşı bir erişim kontrolü değildir; bunu tersine iddia etme.
6. Başka kurumların logosunu, doğrulama sonucunu veya rapor içeriğini taklit etme.
7. Paket eklemeden önce neden gerekli olduğunu değerlendir; gereksiz mimari, veritabanı, kullanıcı hesabı, yönetim paneli ekleme.
8. İşi bitirince yerelde çalıştırma adımını ve test sonucunu bildir, kullanıcı onayını bekle.
