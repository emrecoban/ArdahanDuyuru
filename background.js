const ALARM_NAME = "checkAnnouncements";
const TARGET_URL = "https://www.ardahan.edu.tr/";

// Eklenti ilk kurulduğunda başla
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
    checkForNewAnnouncements();
});

// Service Worker her başlatıldığında alarmın aktif olduğundan emin ol
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.get(ALARM_NAME, (alarm) => {
        if (!alarm) {
            chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
        }
    });
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
        
        // Service Worker'da DOMParser kullanılamaz.
        // Hatalı bildirimleri ("Haberler" ve "Etkinlikler"in de alınmasını) önlemek için
        // sadece "duyuru" bölümünü izole ediyoruz.
        let searchArea = text;
        const dStart = text.indexOf('class="duyuru"');
        if (dStart !== -1) {
            let dEnd = text.indexOf('class="haber"', dStart);
            if (dEnd === -1) dEnd = text.indexOf('class="etkinlik"', dStart);
            if (dEnd === -1) dEnd = text.length;
            searchArea = text.substring(dStart, dEnd);
        }

        const regex = /<div class="all">[\s\S]*?href=['"]([^'"]+)['"]/ig;
        let match;
        const currentLinks = [];
        
        while ((match = regex.exec(searchArea)) !== null) {
            let url = match[1];
            if(!url.startsWith('http')) {
                url = "https://www.ardahan.edu.tr" + (url.startsWith('/') ? url : '/' + url);
            }
            currentLinks.push(url);
        }

        if (currentLinks.length === 0) return;

        chrome.storage.local.get(["seenAnnouncements", "unreadCount"], (data) => {
            let seen = data.seenAnnouncements || [];
            const previousCount = data.unreadCount || 0;
            
            // İlk kurulumda: mevcut tüm duyuruları "görüldü" say
            if (seen.length === 0) {
                chrome.storage.local.set({ seenAnnouncements: currentLinks, unreadCount: 0 });
                return;
            }
            
            // Yeni duyuruları bul
            let newAnnouncementsCount = 0;
            currentLinks.forEach(link => {
                if (!seen.includes(link)) {
                    newAnnouncementsCount++;
                }
            });
            
            if (newAnnouncementsCount > 0) {
                let totalCount = previousCount + newAnnouncementsCount;
                
                // Badge güncelle
                chrome.action.setBadgeText({ text: totalCount.toString() });
                chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });
                
                // Görülen listeyi güncelle (eski + yeni birleştir, tekrar saymasın)
                const merged = [...new Set([...seen, ...currentLinks])];
                chrome.storage.local.set({ 
                    unreadCount: totalCount,
                    seenAnnouncements: merged 
                });
            } else {
                // Yeni duyuru yok ama listeyi yine de güncelle
                const merged = [...new Set([...seen, ...currentLinks])];
                chrome.storage.local.set({ seenAnnouncements: merged });
            }
        });
    } catch (err) {
        console.error("Duyurular güncellenirken arka plan servisinde hata yaşandı:", err);
    }
}

