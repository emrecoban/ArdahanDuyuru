# Değişiklik Günlüğü (Changelog)

Bu dosya, eklentide yapılan tüm değişikliklerin sürüm bazlı kaydını tutar.  
Sürüm numaralandırma formatı: **MAJOR.MINOR.PATCH**

- **MAJOR** — Büyük, geriye uyumsuz değişiklikler
- **MINOR** — Yeni özellik eklemeleri
- **PATCH** — Hata düzeltmeleri ve küçük iyileştirmeler

---

## [1.2.0] — 2026-04-24

### Eklenen & Düzeltilen
- Bildirimlerdeki (rozet) hatalı sayaç sorunu giderildi (Artık haberler veya etkinlikler yerine, yalnızca yeni duyurular sayılıyor).
- "Hakkında" ekranına projenin açık kaynak kodlarına yönlendiren Github logosu eklendi.
- Değişiklik günlüğü `CHANGELOG.md` üzerinden dinamik okutularak otomatik çalışır hale getirildi (Her zaman son 3 güncellemeyi gösterir).

---

## [1.1.0] — 2026-04-11

### Eklenen
- Hakkında ekranına dinamik versiyon bilgisi badge'i eklendi (manifest.json'dan otomatik okunur).
- Hakkında ekranına değişiklik günlüğü (changelog) bölümü eklendi.
- `CHANGELOG.md` dosyası oluşturuldu — bundan sonraki tüm güncellemeler burada takip edilecek.

---

## [1.0.0] — 2026-04-08

### Eklenen
- İlk sürüm yayınlandı.
- Ana sayfa ve fakülte bazlı duyuru çekme sistemi.
- Kategori filtresi (bottom-sheet modal).
- Yemek menüsü sekmesi.
- Bildirim (badge) desteği.
- Hakkında (geliştirici bilgileri) modalı.
- Duyuru detay açıklama (expand) özelliği.
