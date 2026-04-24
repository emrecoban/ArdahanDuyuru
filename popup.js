// ─── Önbellek: her filtre için ayrı ayrı çekilen duyurular buraya kaydedilir ───
const announcementCache = {};

// ─── Filtre kaynakları: hangi filtre hangi sayfadan çekilir ───────────────────
//     parser: 'ardahan_main'  →  ana ardahan.edu.tr formatı
//     parser: 'ibef'          →  fakülte sitesi formatı (ul > li > a + .event-date)
// URL'ler: https://www.ardahan.edu.tr/ navigasyon menüsünden alındı.
const FILTER_SOURCES = {
    // Ana sayfa — Tüm Üniversite Duyuruları
    'all'               : { url: 'https://www.ardahan.edu.tr/',             parser: 'ardahan_main', base: 'https://www.ardahan.edu.tr'     },

    // ─ Fakülteler ─
    'insani'            : { url: 'https://ibef.ardahan.edu.tr/tr/news',     parser: 'ibef', base: 'https://ibef.ardahan.edu.tr'     },
    'müh'               : { url: 'https://muhf.ardahan.edu.tr/tr/news',     parser: 'ibef', base: 'https://muhf.ardahan.edu.tr'     },
    'iktisadi'          : { url: 'https://iibf.ardahan.edu.tr/tr/news',     parser: 'ibef', base: 'https://iibf.ardahan.edu.tr'     },
    'ilahiyat'          : { url: 'https://ilf.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://ilf.ardahan.edu.tr'      },
    'sağlık'            : { url: 'https://sbf.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://sbf.ardahan.edu.tr'      },
    'güzel sanatlar'    : { url: 'https://gsf.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://gsf.ardahan.edu.tr'      },
    'spor'              : { url: 'https://sporbf.ardahan.edu.tr/tr/news',   parser: 'ibef', base: 'https://sporbf.ardahan.edu.tr'   },

    // ─ Meslek Yüksekokulu ─
    'teknik bilimler'   : { url: 'https://tby.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://tby.ardahan.edu.tr'      },
    'göle'              : { url: 'https://gole.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://gole.ardahan.edu.tr'     },
    'posof'             : { url: 'https://posof.ardahan.edu.tr/tr/news',    parser: 'ibef', base: 'https://posof.ardahan.edu.tr'    },
    'çıldır'            : { url: 'https://cildir.ardahan.edu.tr/tr/news',   parser: 'ibef', base: 'https://cildir.ardahan.edu.tr'   },
    'sağlık hizmetleri' : { url: 'https://shy.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://shy.ardahan.edu.tr'      },
    'sosyal bilimler'   : { url: 'https://sby.ardahan.edu.tr/tr/news',      parser: 'ibef', base: 'https://sby.ardahan.edu.tr'      },

    // ─ Yüksekokul ─
    'besyo'             : { url: 'https://besyo.ardahan.edu.tr/tr/news',    parser: 'ibef', base: 'https://besyo.ardahan.edu.tr'    },
    'turizm'            : { url: 'https://tioy.ardahan.edu.tr/tr/news',     parser: 'ibef', base: 'https://tioy.ardahan.edu.tr'     },
};

// ─── Sayfa Yüklendiğinde ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Sekme (Tab) sistemi
    const tabs     = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t     => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // Bildirim badge'ini sıfırla
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.set({ unreadCount: 0 });

    // İlk yükleme
    loadAnnouncementsForFilter('all');
    loadMenu();

    // ─── Özel Filtre Seçimi ────────────────────────────────────────
    const filterToggle  = document.getElementById('filter-toggle');
    const filterModal   = document.getElementById('filter-modal');
    const filterChevron = document.getElementById('filter-chevron');
    const filterLabel   = document.getElementById('filter-active-label');

    // Toggle: aynı butona basınca aç/kapat
    if (filterToggle && filterModal) {
        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = filterModal.classList.toggle('open');
            filterChevron.classList.toggle('open', isOpen);
        });
    }

    // Seçenek tıklandığında
    document.querySelectorAll('.filter-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const value = opt.dataset.value;
            const label = opt.dataset.label;

            // Aktif class güncelle
            document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            // Buton etiketi güncelle
            filterLabel.textContent = label;

            // Modalı kapat
            filterModal.classList.remove('open');
            filterChevron.classList.remove('open');

            // Duyuruları yükle
            loadAnnouncementsForFilter(value);
        });
    });

    // Overlay arka planına tıklayınca kapat
    if (filterModal) {
        filterModal.addEventListener('click', (e) => {
            if (e.target === filterModal) {
                filterModal.classList.remove('open');
                filterChevron.classList.remove('open');
            }
        });
    }

    // ─── Modal İşlemleri ─────────────────────────────────────────────
    const devInfoBtn = document.getElementById('dev-info-btn');
    const devModal = document.getElementById('dev-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (devInfoBtn && devModal && closeModalBtn) {
        devInfoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            devModal.classList.add('open');

            // Manifest'ten versiyon bilgisini çek
            const versionBadge = document.getElementById('version-badge');
            if (versionBadge) {
                const manifest = chrome.runtime.getManifest();
                versionBadge.textContent = 'v' + manifest.version;
            }

            // Değişiklik günlüğünü dinamik olarak çek ve max 3 tane göster
            loadChangelog();
        });

        closeModalBtn.addEventListener('click', () => {
            devModal.classList.remove('open');
        });

        devModal.addEventListener('click', (e) => {
            if (e.target === devModal) {
                devModal.classList.remove('open');
            }
        });
    }
});

// ─── Filtre bazlı duyuru yükleyici ───────────────────────────────────────────
async function loadAnnouncementsForFilter(filterValue) {
    const listDiv = document.getElementById('duyurular-list');

    // Önbellekte varsa direkt göster (yeniden fetch yok)
    if (announcementCache[filterValue]) {
        renderAnnouncements(announcementCache[filterValue]);
        return;
    }

    // Kaynak yoksa 'all' kaynağını kullan
    const source = FILTER_SOURCES[filterValue] || FILTER_SOURCES['all'];

    listDiv.innerHTML = '<div class="loading">Duyurular yükleniyor...</div>';

    try {
        const res  = await fetch(source.url);
        const html = await res.text();
        const parser = new DOMParser();
        const doc  = parser.parseFromString(html, 'text/html');

        // Uygun parse fonksiyonunu seç
        const items = source.parser === 'ibef'
            ? parseIbef(doc, source.base)
            : parseArdahanMain(doc, source.url);

        // Önbelleğe al
        announcementCache[filterValue] = items;

        // Ana sayfa verisiyse arka plan bildirim kontrolü için kaydet
        // ÖNEMLİ: Mevcut listeyi ezmeyip yenilerini eskinin üzerine ekliyoruz (Merge)
        // Böylece background.js eski duyuruları tekrar "yeni" sanmaz.
        if (filterValue === 'all') {
            chrome.storage.local.get(['seenAnnouncements'], (data) => {
                const seen = data.seenAnnouncements || [];
                const newHrefs = items.map(i => i.href);
                const merged = [...new Set([...seen, ...newHrefs])];
                chrome.storage.local.set({ seenAnnouncements: merged });
            });
        }

        renderAnnouncements(items);

    } catch (e) {
        listDiv.innerHTML = "<div class='error'>Duyurular yüklenirken hata oluştu. Ağ bağlantınızı kontrol edin.</div>";
    }
}

// ─── Parser: ardahan.edu.tr ana sayfa formatı (.duyuru .all) ─────────────────
function parseArdahanMain(doc, baseUrl) {
    const items  = [];
    const origin = new URL(baseUrl).origin;

    doc.querySelectorAll('.duyuru .all').forEach(el => {
        const aTag = el.querySelector('a');
        if (!aTag) return;

        let href = aTag.getAttribute('href') || '';
        if (!href.startsWith('http')) {
            href = origin + (href.startsWith('/') ? href : '/' + href);
        }

        const titleSpan = aTag.querySelector('span');
        const title     = (titleSpan ? titleSpan.textContent : aTag.textContent).trim();
        const dayEl     = aTag.querySelector('.tarih b');
        const monthEl   = aTag.querySelector('.tarih div');
        const dateText  = (dayEl && monthEl)
            ? `${dayEl.textContent.trim()} ${monthEl.textContent.trim()}`
            : '';

        if (title) items.push({ href, title, dateText });
    });

    return items;
}

// ─── Parser: ibef ve diğer fakülte siteleri (ul > li > a + .event-date) ─────
//     ``base`` parametresi: hangi domain'den geldiğini belirler (href'leri tamamlamak için)
function parseIbef(doc, base) {
    const items = [];
    const BASE  = base || 'https://ibef.ardahan.edu.tr';

    doc.querySelectorAll('.blog-post-inner ul li').forEach(li => {
        const aTag = li.querySelector('a');
        if (!aTag) return;

        let href = aTag.getAttribute('href') || '';
        if (!href.startsWith('http')) {
            href = BASE + (href.startsWith('/') ? href : '/' + href);
        }

        // Başlığı temizle: .blink span ("Yeni" / "Önemli" gibi etiketler) çıkar
        const aClone = aTag.cloneNode(true);
        aClone.querySelectorAll('.blink').forEach(el => el.remove());
        const title = aClone.textContent.replace(/\s+/g, ' ').trim();

        // Tarih: .event-date içindeki metni al
        const dateEl   = li.querySelector('.event-date');
        const dateText = dateEl
            ? dateEl.textContent.replace(/\s+/g, ' ').trim()
            : '';

        if (title) items.push({ href, title, dateText });
    });

    return items;
}

// ─── Duyuruları ekrana çiz ────────────────────────────────────────────────────
function renderAnnouncements(items) {
    const listDiv = document.getElementById('duyurular-list');
    listDiv.innerHTML = '';

    if (items.length === 0) {
        listDiv.innerHTML = "<div class='error'>Duyuru bulunamadı. Lütfen daha sonra tekrar deneyin.</div>";
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `
            <div class="list-item-header">
                <a href="${item.href}" target="_blank" class="item-content">
                    <div class="item-date">
                        <span class="item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        ${item.dateText}
                    </div>
                    <div class="item-title">${item.title}</div>
                </a>
                <button class="expand-btn" title="Kısa Açıklamayı Gör">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            </div>
            <div class="item-details" style="display: none;">
                <div class="item-details-content">
                    <div class="loading-mini">Yükleniyor...</div>
                </div>
            </div>
        `;

        const expandBtn = el.querySelector('.expand-btn');
        const detailsDiv = el.querySelector('.item-details');
        const detailsContent = el.querySelector('.item-details-content');

        expandBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const isExpanded = detailsDiv.style.display === 'block';

            if (isExpanded) {
                detailsDiv.style.display = 'none';
                expandBtn.classList.remove('expanded');
            } else {
                detailsDiv.style.display = 'block';
                expandBtn.classList.add('expanded');

                if (!item.shortDescLoaded) {
                    try {
                        const res = await fetch(item.href);
                        const html = await res.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        let text = '';
                        const paragraphs = doc.querySelectorAll('.icerik p, .blog-post-content p, #page-content p, p');
                        for (let p of paragraphs) {
                            // HTML elementlerini temizleyip sadece yazıyı alıyoruz
                            const t = p.textContent.trim().replace(/\s+/g, ' ');
                            if (t.length > 30) {
                                text = t;
                                break;
                            }
                        }

                        if (!text) text = "Bu duyuru için sistemde kısa bir açıklama veya özet metni bulunamadı.";
                        if (text.length > 250) text = text.substring(0, 250) + '...';

                        detailsContent.innerHTML = text;
                        item.shortDescLoaded = true;
                    } catch(err) {
                        detailsContent.innerHTML = '<span class="error-text">Açıklama yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.</span>';
                    }
                }
            }
        });

        listDiv.appendChild(el);
    });
}

// ─── Yemek Menüsü ─────────────────────────────────────────────────────────────
async function loadMenu() {
    const menuDiv = document.getElementById('menu-list');
    try {
        const res    = await fetch('https://sksdb.ardahan.edu.tr/tr/page/aylik-yemek-menusu/9265');
        const html   = await res.text();
        const parser = new DOMParser();
        const doc    = parser.parseFromString(html, 'text/html');

        const links = doc.querySelectorAll("a[href$='.pdf']");
        menuDiv.innerHTML = '';

        let addedCount = 0;
        links.forEach(a => {
            if (addedCount >= 5) return;

            let href = a.getAttribute('href');
            if (!href.startsWith('http')) {
                href = 'https://sksdb.ardahan.edu.tr' + href;
            }

            let text = a.textContent.trim();
            if (!text || text.toLowerCase().includes('tıkla')) {
                if (a.parentElement && a.parentElement.tagName === 'SPAN') {
                    text = a.parentElement.textContent.replace(/Tıklayınız\.*/gi, '').trim();
                } else {
                    text = decodeURIComponent(href.split('/').pop().replace('.pdf', ''));
                }
            }
            text = text.replace(/için\s*$/, '').trim();

            const item    = document.createElement('a');
            item.href     = href;
            item.target   = '_blank';
            item.className = 'list-item menu-item';
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

// ─── Değişiklik Günlüğünü Okuma ──────────────────────────────────────────────
async function loadChangelog() {
    const listDiv = document.getElementById('dynamic-changelog');
    if (!listDiv || listDiv.dataset.loaded === 'true') return;

    try {
        const url = chrome.runtime.getURL('CHANGELOG.md');
        const res = await fetch(url);
        const text = await res.text();

        const regex = /##\s*\[(.*?)\][^\n]*\n([\s\S]*?)(?=\n##\s*\[|$)/g;
        let match;
        const items = [];

        while ((match = regex.exec(text)) !== null) {
            let version = match[1];
            let content = match[2].trim();
            
            let firstBullet = "";
            let lines = content.split('\n');
            for(let line of lines) {
                line = line.trim();
                if(line.startsWith('-')) {
                    firstBullet = line.replace(/^- /, '').replace(/\*/g, '').trim();
                    break;
                }
            }
            if(!firstBullet) firstBullet = content.substring(0, 100);

            items.push({ version: 'v' + version, desc: firstBullet });
        }

        if (items.length > 0) {
            listDiv.innerHTML = '';
            // En fazla son 3 tanesini al
            const recent = items.slice(0, 3);
            recent.forEach(item => {
                listDiv.innerHTML += `
                    <div class="changelog-item">
                        <span class="changelog-version">${item.version}</span>
                        <span class="changelog-text">${item.desc}</span>
                    </div>
                `;
            });
            listDiv.dataset.loaded = 'true';
        } else {
             listDiv.innerHTML = '<div class="changelog-item"><span class="changelog-text">Günlük bulunamadı.</span></div>';
        }
    } catch(err) {
        console.error("Changelog yüklenemedi:", err);
        listDiv.innerHTML = '<div class="changelog-item"><span class="changelog-text">Günlük yüklenirken hata oluştu.</span></div>';
    }
}
