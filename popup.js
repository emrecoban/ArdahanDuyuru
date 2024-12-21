document.addEventListener("DOMContentLoaded", async () => {
  const listElement = document.getElementById("link-list");

  try {
    // Belirtilen URL'den HTML al
    const response = await fetch(
      "https://ardahan.edu.tr/tum-haber-duyuru.aspx?type=0"
    );
    const text = await response.text();

    // DOMParser kullanarak HTML'yi ayrıştır
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // İlgili div içindeki bağlantıları seç
    const contentDiv = doc.querySelector("#ContentPlaceHolder1_liste_icerik");
    const links = contentDiv ? contentDiv.querySelectorAll("a") : [];

    // Bağlantıları listele
    listElement.innerHTML = ""; // Listeyi temizle
    if (links.length > 0) {
      links.forEach((link) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = link.innerText.trim() || "Link Metni Yok";
        a.href = link.href.startsWith("http")
          ? link.href
          : `https://ardahan.edu.tr/${link.getAttribute("href")}`;
        a.target = "_blank"; // Yeni sekmede aç
        li.appendChild(a);
        listElement.appendChild(li);
      });
    } else {
      listElement.textContent = "Hiçbir bağlantı bulunamadı.";
    }
  } catch (error) {
    console.error("Veri alınırken bir hata oluştu:", error);
    listElement.textContent = "Bağlantılar yüklenemedi.";
  }
});
