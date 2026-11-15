# Cursor için ilk prompt — SADECE YEREL PROTOTİP

Aşağıdaki metni Cursor Agent'a yapıştır:

---

**Yalnızca 1. aşamayı uygula.** Bir QR kodundan `/public/report/<32-hex-token>` adresine gidildiğinde ilgili örnek PDF'yi gösteren küçük Next.js uygulamasını **yerel bilgisayarımda** çalıştırmak istiyorum.

Önce proje kökündeki `AGENTS.md`, `00-BASLANGIC.md`, `01-GEREKSINIMLER.md`, `02-MIMARI.md`, `03-URL-VE-QR.md`, `04-ARAYUZ.md`, `05-GUVENLIK-SEO.md`, `06-YEREL-CALISTIRMA.md`, `09-TEST-PLANI.md` belgelerini oku.

Şunları uygula:

1. Next.js App Router + TypeScript + Tailwind CSS kurulumu.
2. `/public/report/[token]` rapor sayfası (Türkçe, basit, mobil uyumlu).
3. `/api/report/[token]/pdf` ile `local-data/reports/<token>.pdf` içinden sunucu tarafında PDF sunumu. Token 32 küçük hex olmalı; bilinmeyen token 404.
4. Test için içinde **gerçek kişi bilgisi olmayan** basit bir PDF oluşturacak `npm run seed:demo` komutu; demo tokenı üret veya mevcut örnek tokenı kullan. Terminale test adresini yaz.
5. Test URL'sini taşıyan bir QR PNG'si üret; `SITE_URL` çevresel değişkeninden URL oluştur. `localhost` QR'sinin telefonda çalışmayacağını README'de belirt.
6. HTML ve PDF `noindex` başlıkları, PDF için `no-store`; `local-data`, `exports`, `.env.local` gitignore.
7. README'de sadece yerel kurulum ve test adımları. Temel testleri ve `npm run build` komutunu çalıştırabiliyorsan çalıştır, hataları gider.

**Kesin yasaklar:** Vercel/deploy, DNS, gerçek domain, bulut storage, hosting, canlıya alma, CI/CD, veritabanı, admin paneli, gerçek sağlık raporları, üçüncü taraf doğrulama entegrasyonu ve `/web/RaporDogrulama.aspx` alternatifi bu aşamaya dahil değil. Üretim ortamına geçiş için talimat bile hazırlama. Kullanıcı talep etmeden 2. aşamaya geçme.

İş bitince bana yalnızca: (a) neler hazır, (b) hangi komutlarla yerelde açacağım, (c) test URL'si, (d) neyi test etmem gerektiği ve varsa hatalar şeklinde kısa bir sonuç ver. **Sonra dur ve geri bildirimimi bekle.**
