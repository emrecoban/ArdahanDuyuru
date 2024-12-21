// Sayfadaki tüm bağlantıları seç ve al
const pageLinks = [];
const links = document.querySelectorAll("a"); // Tüm <a> etiketlerini seç

links.forEach((link) => {
  pageLinks.push({
    text: link.innerText.trim() || "Link Metni Yok", // Link metni boşsa alternatif göster
    href: link.href, // Link adresi
  });
});

// Arka plana linkleri gönder
chrome.runtime.sendMessage({ action: "updateLinks", data: pageLinks });
