const ALARM_NAME = "checkAnnouncements";
const TARGET_URL = "https://www.ardahan.edu.tr/";

// Eklenti ilk kurulduğunda başla
chrome.runtime.onInstalled.addListener(() => {
    // 30 Dakikada bir çalışacak alarm kurulur
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
    // Kurulduğu gibi bir kere kontrol yapalım
    checkForNewAnnouncements();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        checkForNewAnnouncements();
    }
});

async function checkForNewAnnouncements() {
    try {
        const res = await fetch(TARGET_URL);
        const text = await res.text();

        // Service Worker'da 'DOMParser' kullanılamadığı için Regex ile bağlantıları tespit ediyoruz
        // Duyuru kapsayıcı class mantığı: <div class="all"> ... <a href="Contents...">
        const regex = /<div class="all">[\s\S]*?href=['"]([^'"]+)['"]/ig;
        let match;
        const currentLinks = [];

        while ((match = regex.exec(text)) !== null) {
            let url = match[1];
            if (!url.startsWith('http')) {
                url = "https://www.ardahan.edu.tr/" + url;
            }
            currentLinks.push(url);
        }

        if (currentLinks.length === 0) return;

        chrome.storage.local.get(["seenAnnouncements", "unreadCount"], (data) => {
            let seen = data.seenAnnouncements || [];
            const previousCount = data.unreadCount || 0;

            // Eğer eklenti ilk kez kurulduysa (seen.length === 0), tüm linkleri görüldü say
            // ki sıfırdan 20 bildirimle başlamasın. Sadece sonrakilere bildirim verecek.
            if (seen.length === 0) {
                chrome.storage.local.set({ seenAnnouncements: currentLinks, unreadCount: 0 });
                return;
            }

            let newAnnouncementsCount = 0;
            currentLinks.forEach(link => {
                // Eğer şu an sitede olup da daha önce görmediklerimiz listesinde olan varsa sayısını arttır
                if (!seen.includes(link)) {
                    newAnnouncementsCount++;
                }
            });

            if (newAnnouncementsCount > 0) {
                let totalCount = previousCount + newAnnouncementsCount;

                // Chrome rozeti (Badge) güncellemesi
                chrome.action.setBadgeText({ text: totalCount.toString() });
                chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" }); // Kırmızı arkaplan

                // Masaüstü bildirimi (Notification) gösterimi
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon-128.png',
                    title: 'ARÜ Yeni Duyuru!',
                    message: `${newAnnouncementsCount} adet yeni duyuru eklendi.`,
                    priority: 2
                }, (notificationId) => {
                    if (chrome.runtime.lastError) console.warn("Bildirim hatası:", chrome.runtime.lastError.message);
                });

                // Storage güncellemesi
                chrome.storage.local.set({
                    unreadCount: totalCount,
                    seenAnnouncements: currentLinks
                });
            }
        });
    } catch (err) {
        console.error("Duyurular güncellenirken arka plan servisinde hata yaşandı:", err);
    }
}
