let currentDuyuruUrl = "https://www.ardahan.edu.tr/";

document.addEventListener('DOMContentLoaded', () => {
  // Sekme (Tab) Sistemi
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  // Kullanıcı popup'ı açtığı için bildirim Badge'ini sıfırlıyoruz.
  chrome.action.setBadgeText({ text: "" });
  chrome.storage.local.set({ unreadCount: 0 });

  // Eklenti açıldığında state durumuna göre URL yükleme yapılabilir, şimdilik varsayılan adresi kullanıyoruz
  loadAnnouncements();
  loadMenu();

  // Filtre (Duyuru Kaynağı) Sistemi
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDuyuruUrl = btn.dataset.url;
      loadAnnouncements();
    });
  });

  // Hakkında (Info) Modal Sistemi
  const infoBtn = document.getElementById('info-btn');
  const modalOverlay = document.getElementById('about-modal');
  const closeModal = document.getElementById('close-modal');

  if (infoBtn && modalOverlay && closeModal) {
    infoBtn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });

    // Modal dışına tıklandığında da kapansın
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }
});

async function loadAnnouncements() {
  const listDiv = document.getElementById('duyurular-list');
  try {
    const res = await fetch(currentDuyuruUrl);
    const html = await res.text();

    // Gelen kaynak kodu parse edilebilir HTML nesnesine dönüştürüyoruz
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Sitedeki güncel duyuru divlerini seçiyoruz
    let duyuruElements = doc.querySelectorAll('.duyuru .all');
    let isMainSiteTemplate = true;
    let isAllNewsTemplate = false;

    if (duyuruElements.length === 0) {
      // "Tüm Duyurular" sayfası kontrolü (örn. /tr/news)
      duyuruElements = doc.querySelectorAll('.blog-post-inner ul li');
      if (duyuruElements.length > 0) {
        isAllNewsTemplate = true;
        isMainSiteTemplate = false;
      } else {
        // Alt domain özel teması (.event-small-list)
        const widgetTitles = doc.querySelectorAll('.widget-title, .widget-main-title h4');
        let duyuruContainer = null;
        for (let t of widgetTitles) {
          if (t.textContent.includes("Duyurular")) {
            const parent = t.closest('.widget-main');
            if (parent) {
              duyuruContainer = parent.querySelector('.widget-inner');
              break;
            }
          }
        }
        if (duyuruContainer) {
          duyuruElements = duyuruContainer.querySelectorAll('.event-small-list');
        } else {
          duyuruElements = doc.querySelectorAll('.event-small-list');
        }
        isMainSiteTemplate = false;
      }
    }

    listDiv.innerHTML = "";
    let currentLinks = [];

    duyuruElements.forEach(el => {
      let href, title, dateText;

      if (isMainSiteTemplate) {
        const aTag = el.querySelector('a');
        if (!aTag) return;
        href = aTag.getAttribute('href');
        const titleSpan = aTag.querySelector('span');
        title = titleSpan ? titleSpan.textContent.trim() : "Başlıksız Duyuru";
        const dayEl = aTag.querySelector('.tarih b');
        const monthEl = aTag.querySelector('.tarih div');
        dateText = (dayEl && monthEl) ? `${dayEl.textContent} ${monthEl.textContent}` : "";
      } else if (isAllNewsTemplate) {
        const aTag = el.querySelector('a');
        if (!aTag) return;
        href = aTag.getAttribute('href');

        const titleClone = aTag.cloneNode(true);
        const spans = titleClone.querySelectorAll('span');
        spans.forEach(s => s.remove());
        title = titleClone.textContent.replace(/\s+/g, ' ').trim();

        const dateSpan = el.querySelector('.event-date');
        if (dateSpan) {
          dateText = dateSpan.textContent.replace('-', '').trim();
        } else {
          dateText = "";
        }
      } else {
        const titleAnchor = el.querySelector('.event-small-title a');
        if (!titleAnchor) return;
        href = titleAnchor.getAttribute('href');

        const titleClone = titleAnchor.cloneNode(true);
        const spans = titleClone.querySelectorAll('span');
        spans.forEach(s => s.remove());
        title = titleClone.textContent.replace(/\s+/g, ' ').trim();

        const dayEl = el.querySelector('.calendar-small .s-date');
        const monthEl = el.querySelector('.calendar-small .s-month');
        dateText = (dayEl && monthEl) ? `${dayEl.textContent} ${monthEl.textContent}` : "";
      }

      let baseUrl = new URL(currentDuyuruUrl).origin;
      // Linkler göreceli ise başına ilgili sitenin adresini ekliyoruz
      if (!href.startsWith('http')) {
        href = href.startsWith('/') ? baseUrl + href : baseUrl + "/" + href;
      }
      currentLinks.push(href);

      const item = document.createElement('a');
      item.href = href;
      item.target = "_blank"; // Tıklanınca yeni sekmede açılır
      item.className = "list-item";
      item.innerHTML = `
                <div class="item-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="item-left" style="flex:1; padding-right:10px;">
                        <div class="item-date">
                            <span class="item-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                            ${dateText}
                        </div>
                        <div class="item-title">${title}</div>
                    </div>
                </div>
            `;

      // Artı İkonu
      const expandBtn = document.createElement('div');
      expandBtn.className = "expand-btn";
      expandBtn.title = "Kısa açıklamayı gör";
      expandBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            `;
      item.querySelector('.item-header').appendChild(expandBtn);

      // Açıklama Alanı
      const descDiv = document.createElement('div');
      descDiv.className = "item-desc";
      item.appendChild(descDiv);

      expandBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Linkin açılmasını ve sayfaya yönlendirmeyi engeller
        e.stopPropagation();

        if (descDiv.classList.contains('active')) {
          descDiv.classList.remove('active');
          expandBtn.style.transform = "rotate(0deg)";
          return;
        }

        expandBtn.style.transform = "rotate(45deg)";
        descDiv.classList.add('active');

        if (descDiv.innerHTML === "") { // Sadece ilk tıklandığında veri çekmek için yükle
          descDiv.innerHTML = '<div class="desc-loading">Açıklama yükleniyor...</div>';
          try {
            const dlRes = await fetch(href);
            const dlHtml = await dlRes.text();
            const dlParser = new DOMParser();
            const dlDoc = dlParser.parseFromString(dlHtml, "text/html");

            let detailText = "";
            const contentEl = dlDoc.getElementById('ContentPlaceHolder1_Lbl_ViewTypeNormalText');
            if (contentEl) {
              detailText = contentEl.textContent.trim();
            } else {
              const innerEl = dlDoc.querySelector('.blog-post-inner, .page-content, article');
              if (innerEl) detailText = innerEl.textContent.trim();
            }

            detailText = detailText.replace(/\s+/g, ' ').trim();
            if (detailText.length > 200) {
              detailText = detailText.substring(0, 200) + "...";
            }

            descDiv.innerHTML = detailText || "Bu duyuru için açıklama metni bulunamadı.";
          } catch (err) {
            descDiv.innerHTML = "Açıklama alınırken bağlantı hatası oluştu.";
          }
        }
      });

      listDiv.appendChild(item);
    });

    // Son görülen duyuruları kaydedelim ki arka plan (background) tekrar bildirim atmasın
    // Sadece mevcuttakileri değil, eski kayıtlarla birleştirerek kaydediyoruz.
    chrome.storage.local.get(["seenAnnouncements"], (data) => {
      let seen = data.seenAnnouncements || [];
      currentLinks.forEach(link => {
        if (!seen.includes(link)) {
          seen.push(link);
        }
      });

      // Çok fazla element birikmesin, belleği yormayalım
      if (seen.length > 200) {
        seen = seen.slice(-100);
      }

      chrome.storage.local.set({
        seenAnnouncements: seen,
        unreadCount: 0 // Bildirim sayısını sıfırla
      });

      // Rozeti temizle
      if (chrome.action) {
        chrome.action.setBadgeText({ text: "" });
      }
    });

    if (duyuruElements.length === 0) {
      listDiv.innerHTML = "<div class='error'>Duyuru bulunamadı. Lütfen daha sonra tekrar deneyin.</div>";
    }
  } catch (e) {
    listDiv.innerHTML = "<div class='error'>Duyurular yüklenirken hata oluştu. Ağ bağlantınızı kontrol edin.</div>";
  }
}

async function loadMenu() {
  const menuDiv = document.getElementById('menu-list');
  try {
    // ARÜ SKS Daire Başkanlığı Yemek Menüsü sayfası
    const res = await fetch("https://sksdb.ardahan.edu.tr/tr/page/aylik-yemek-menusu/9265");
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Sitede paylaşılan PDF dosyası linklerini buluyoruz
    const links = doc.querySelectorAll("a[href$='.pdf']");
    menuDiv.innerHTML = "";

    let addedCount = 0;
    links.forEach(a => {
      if (addedCount >= 5) return; // Sadece en güncel 5 menüyü gösterelim

      let href = a.getAttribute('href');
      if (!href.startsWith('http')) {
        href = "https://sksdb.ardahan.edu.tr" + href;
      }

      // Başlığı çıkarma mantığı (Sitenin karmaşık SPAN yapısını temizlemek için)
      let text = a.textContent.trim();
      if (!text || text.toLowerCase().includes("tıkla")) {
        if (a.parentElement && a.parentElement.tagName === 'SPAN') {
          text = a.parentElement.textContent.replace(/Tıklayınız\.*/gi, "").trim();
        } else {
          // Hiç isimlendirme bulunamazsa PDF adının kendisini yansıt
          text = decodeURIComponent(href.split('/').pop().replace('.pdf', ''));
        }
      }
      text = text.replace(/için\s*$/, "").trim(); // Sondaki gereksiz 'için' kelimesini at

      const item = document.createElement('a');
      item.href = href;
      item.target = "_blank";
      item.className = "list-item menu-item";
      item.innerHTML = `
                <div class="menu-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20" />
                        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                    </svg>
                </div>
                <div class="item-title">${text}</div>
            `;
      menuDiv.appendChild(item);
      addedCount++;
    });

    if (addedCount === 0) {
      menuDiv.innerHTML = "<div class='error'>Yemek menüsü bulunamadı.</div>";
    }
  } catch (e) {
    menuDiv.innerHTML = "<div class='error'>Yemek menüsü yüklenirken hata oluştu.</div>";
  }
}
