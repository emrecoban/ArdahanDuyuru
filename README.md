# ARÜ Duyuru ve Menü — Chrome Eklentisi

![Sürüm](https://img.shields.io/badge/sürüm-v1.1.0-blue?style=flat-square)
![Lisans](https://img.shields.io/badge/lisans-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Chrome-yellow?style=flat-square)

**Ardahan Üniversitesi** resmi web sitesindeki duyuruları ve yemek menüsünü tek bir tıklamayla takip edebileceğiniz, açık kaynak kodlu Chrome eklentisidir.

---

## ✨ Özellikler

- 📢 **Güncel Duyurular** — Üniversitenin ana sayfasından anlık duyuru akışı
- 🏫 **Fakülte & MYO Filtresi** — 16 farklı birimden (fakülte, MYO, yüksekokul) duyuruları ayrı ayrı görüntüleme
- 🍽️ **Yemek Menüsü** — Aylık yemek menüsü PDF'lerine hızlı erişim
- 🔔 **Bildirim Desteği** — Yeni duyurularda badge sayacı ile anlık bildirim
- 📖 **Detay Görüntüleme** — Duyuruların kısa açıklamasını eklenti içinde genişleterek okuma
- ℹ️ **Hakkında & Sürüm Bilgisi** — Geliştirici bilgileri ve değişiklik günlüğü

---

## 📸 Ekran Görüntüsü

![Eklenti Görünümü](/1.1-guncel.png)

---

## 🚀 Kurulum

### Yöntem 1: Kaynak Koddan Kurulum

1. Bu repository'yi klonlayın:
   ```bash
   git clone https://github.com/emrecoban/ArdahanDuyuru.git
   ```
2. Chrome tarayıcınızda `chrome://extensions` adresine gidin.
3. Sağ üst köşeden **Geliştirici modu**'nu etkinleştirin.
4. **"Paketlenmemiş öğe yükle"** butonuna tıklayın.
5. İndirdiğiniz klasörü seçin — eklenti yüklenecektir.

### Yöntem 2: ZIP ile Kurulum

1. Sayfanın üstündeki yeşil **Code** butonuna tıklayıp **Download ZIP** seçin.
2. ZIP dosyasını bir klasöre çıkarın.
3. Yukarıdaki 2–5 adımlarını takip edin.

> ⚠️ **Not:** Yüklediğiniz klasörü silmeyin, eklenti çalışmayı durdurur.

---

## 📁 Proje Yapısı

```
ArdahanDuyuru/
├── manifest.json      # Eklenti tanımı ve izinler
├── background.js      # Arka plan servisi (bildirimler)
├── popup.html         # Ana arayüz yapısı
├── popup.css          # Stil dosyası
├── popup.js           # Uygulama mantığı (duyuru çekme, filtre, menü)
├── CHANGELOG.md       # Sürüm değişiklik günlüğü
├── README.md          # Bu dosya
└── LICENSE            # MIT Lisansı
```

---

## 🔧 Teknik Detaylar

| Özellik | Detay |
|---|---|
| **Manifest** | V3 |
| **İzinler** | `storage`, `alarms` |
| **Host İzni** | `*://*.ardahan.edu.tr/*` |
| **Veri Kaynağı** | Üniversite web siteleri (canlı fetch + DOMParser) |
| **Önbellek** | Oturum bazlı bellek içi cache |

---

## 📝 Değişiklik Günlüğü

Tüm sürüm geçmişi için [CHANGELOG.md](CHANGELOG.md) dosyasına bakınız.

### Son Sürüm: v1.1.0 (11 Nisan 2026)
- Hakkında ekranına dinamik versiyon bilgisi eklendi.
- Değişiklik günlüğü bölümü eklendi.
- `CHANGELOG.md` dosyası oluşturuldu.

---

## 🤝 Katkıda Bulunma

Katkıda bulunmak istiyorsanız lütfen şu adımları izleyin:

1. Bu repository'yi **fork** edin.
2. Yeni bir dal oluşturun: `git checkout -b ozellik-adi`
3. Değişikliklerinizi commit edin: `git commit -m 'Yeni bir özellik eklendi'`
4. Dalınızı push edin: `git push origin ozellik-adi`
5. Bir **Pull Request** açın.

---

## 👥 Geliştiriciler

- [Mahmut Şaşkın](https://github.com/MahmutSaskn)

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
