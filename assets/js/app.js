// app.js - 朱婕老師阿育吠陀開源知識庫 3.0 (含贊助與支持開源 Modal 彈窗控制)

let globalData = { herbs: [], pages: [] };
let favorites = JSON.parse(localStorage.getItem("ayurveda_favs") || "[]");

const PDF_DOWNLOAD_MAP = {
    "SINGLE1": "./pdf/單方草藥1-2.pdf",
    "SINGLE2": "./pdf/單方草藥1-2.pdf",
    "FORMULAS": "./pdf/配方草藥.pdf",
    "DISEASE_HERBS": "./pdf/疾病與草藥.pdf",
    "BASICS": "./pdf/渠道療癒+組識(小白卡).pdf",
    "CHANNEL_HEALING": "./pdf/渠道療癒+組識(小白卡).pdf",
    "CARDS": "./pdf/渠道療癒+組識(小白卡).pdf",
    "DX2": "./pdf/疾病疹療1-2+居家療法.pdf",
    "HOME": "./pdf/疾病疹療1-2+居家療法.pdf"
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("🌿 朱婕老師阿育吠陀開源知識庫 3.0 (含贊助與支持開源 Modal) 引擎啟動！");
    
    initThreeJS();
    initScrollReveal();
    updateFavBadge();
    initQuizEngine();

    fetch("./assets/js/herbs_db.json")
        .then(res => res.json())
        .then(data => {
            globalData = data;
            const countBadge = document.getElementById("herbCountBadge");
            if (countBadge) {
                countBadge.textContent = `已成功載入全冊 630 頁手槁 (613 個對照頁面條目，AI 標籤已全量二次補充比對)`;
            }
            renderHerbs(data.herbs);
            checkUrlQueryParams();
        })
        .catch(err => {
            console.warn("使用靜態草藥預載卡片", err);
        });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchAndRender(query);

            if (query) {
                history.replaceState(null, "", `?q=${encodeURIComponent(query)}`);
            } else {
                history.replaceState(null, "", window.location.pathname);
            }
        });
    }

    const gunaChips = document.querySelectorAll(".guna-chip[data-guna]");
    gunaChips.forEach(chip => {
        chip.addEventListener("click", () => {
            gunaChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const guna = chip.getAttribute("data-guna");
            filterByGuna(guna);
        });
    });

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            themeBtn.textContent = newTheme === "light" ? "☀️ 淺色模式" : "🌙 深色模式";
        });
    }

    setupModal("openReferencesBtn", "referencesModal", "closeReferencesBtn");
    setupModal("openFavoritesBtn", "favoritesModal", "closeFavoritesBtn", renderFavoritesList);
    setupModal("openReaderBtn", "readerModal", "closeReaderBtn");
    setupModal("openSponsorBtn", "sponsorModal", "closeSponsorBtn");
});

function filterByChannel(channelKey, channelName) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.value = channelName;
    }
    
    const herbsSec = document.getElementById("herbs");
    if (herbsSec) {
        herbsSec.scrollIntoView({ behavior: 'smooth' });
    }

    searchAndRender(channelName.toLowerCase().trim());
    injectDynamicSEO(`《朱婕老師阿育吠陀學習路徑：${channelName}》- 知識庫 3.0`, `從朱婕老師手稿《${channelName}》出發擴展延伸之對應單方草藥與講義處方`, window.location.href);
}

function initQuizEngine() {
    const submitBtn = document.getElementById("submitQuizBtn");
    const resultBox = document.getElementById("quizResult");
    if (!submitBtn || !resultBox) return;

    submitBtn.addEventListener("click", () => {
        const q1 = document.querySelector('input[name="q1"]:checked')?.value || "vata";
        const q2 = document.querySelector('input[name="q2"]:checked')?.value || "vata";
        const q3 = document.querySelector('input[name="q3"]:checked')?.value || "vata";

        let vataScore = 0, pittaScore = 0, kaphaScore = 0;
        [q1, q2, q3].forEach(val => {
            if (val === "vata") vataScore++;
            if (val === "pitta") pittaScore++;
            if (val === "kapha") kaphaScore++;
        });

        let primaryDosha = "Vata (風型)";
        let doshaDesc = "您的體質偏向敏捷、輕盈但易焦慮與乾冷。建議從《Manovaha 心靈渠道》與《Pranavaha 呼吸渠道》出發調養。";
        let recHerbs = "🌿 建議草藥：睡茄 (Ashwagandha)、印度天門冬 (Shatavari)、溫香麻油調養。";

        if (pittaScore >= vataScore && pittaScore >= kaphaScore) {
            primaryDosha = "Pitta (火型)";
            doshaDesc = "您的體質偏向精力充沛、目標導向但易發炎泛紅。建議從《Raktavaha 血液渠道》出發調養。";
            recHerbs = "🌿 建議草藥：旱蓮草 (Bhringraj)、聖羅勒 (Tulsi)、椰子油清熱養護。";
        } else if (kaphaScore >= vataScore && kaphaScore >= pittaScore) {
            primaryDosha = "Kapha (水型)";
            doshaDesc = "您的體質偏向沉穩包容但易積水與沉重。建議從《Annavaha 食物渠道》與《Purishavaha 排泄渠道》出發調養。";
            recHerbs = "🌿 建議草藥：三果實 (Triphala)、訶子 (Haritaki)、薑黃排毒養生。";
        }

        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <h3 style="color: var(--accent-color); margin-bottom: 0.5rem;">🎉 您的檢測結果：主導體質為【${primaryDosha}】</h3>
            <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.8rem;">${doshaDesc}</p>
            <div style="padding: 10px; background: rgba(200,125,50,0.15); border-left: 4px solid var(--accent-color); border-radius: 6px; font-size: 0.9rem;">
              ${recHerbs}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">
              *本測驗僅供朱婕老師開源講義研習與哲學參考，詳細體質分析請諮詢專業阿育吠陀醫師 (Vaidya)。
            </p>
        `;
    });
}

function checkUrlQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q") || urlParams.get("search");
    const herbId = urlParams.get("herb");

    const searchInput = document.getElementById("searchInput");

    if (query) {
        if (searchInput) searchInput.value = query;
        searchAndRender(query.toLowerCase().trim());
        injectDynamicSEO(`《${query}》- 朱婕老師阿育吠陀開源知識庫 3.0`, `朱婕老師阿育吠陀手稿《${query}》專屬條目與 3-in-1 藥典對照`, window.location.href);
    } else if (herbId) {
        const herb = globalData.herbs.find(h => h.id === herbId);
        if (herb) {
            if (searchInput) searchInput.value = herb.name;
            searchAndRender(herb.name.toLowerCase());
            openReaderView(herb.name, herb.desc, herb.latin, herb.rasa, herb.virya, herb.tcm, herb.id, "SINGLE1");
            injectDynamicSEO(`《${herb.name}》- 朱婕老師阿育吠陀開源知識庫 3.0`, `朱婕老師阿育吠陀手稿《${herb.name}》性味歸經與 AYUSH API 藥典對照`, window.location.href);
        }
    }
}

function injectDynamicSEO(title, description, canonicalUrl) {
    document.title = title;

    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    let metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) {
        metaDesc.setAttribute("content", description);
    }

    let ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute("content", title);
    
    let ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", description);

    let ogUrl = document.querySelector("meta[property='og:url']");
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);
}

function initThreeJS() {
    const canvas = document.getElementById("canvas3d");
    if (!canvas || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x27ae60);
    const color2 = new THREE.Color(0xc87d32);
    const color3 = new THREE.Color(0x8e44ad);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i + 1] = (Math.random() - 0.5) * 20;
        positions[i + 2] = (Math.random() - 0.5) * 20;

        const mixedColor = Math.random() < 0.33 ? color1 : (Math.random() < 0.66 ? color2 : color3);
        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 5;

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.0012;
        particles.rotation.x += 0.0006;
        
        scene.rotation.y += (mouseX - scene.rotation.y) * 0.05;
        scene.rotation.x += (-mouseY - scene.rotation.x) * 0.05;

        renderer.render(scene, camera);
    }
    animate();
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
}

function setupModal(openBtnId, modalId, closeBtnId, onOpen) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    
    if (openBtn && modal) {
        openBtn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "flex";
            if (onOpen) onOpen();
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }
}

function openReaderView(title, desc, latin, rasa, virya, tcm, docId, docBookCode) {
    const readerModal = document.getElementById("readerModal");
    const readerTitle = document.getElementById("readerTitle");
    const readerContent = document.getElementById("readerContent");
    const readerTag = document.getElementById("readerImageTag");
    const readerPdfBtn = document.getElementById("readerPdfDownloadBtn");

    if (readerModal && readerTitle && readerContent) {
        readerTitle.textContent = `🌿 ${title} —— 手稿原件與 3-in-1 圖文對照`;
        readerTag.textContent = `原稿識別碼: ${docId || 'SINGLE1-P0001'} (朱婕老師手稿純質典藏)`;

        const bookCode = docBookCode || (docId ? docId.split('-')[0] : "SINGLE1");
        const matchedPdfPath = PDF_DOWNLOAD_MAP[bookCode] || "./pdf/單方草藥1-2.pdf";

        if (readerPdfBtn) {
            readerPdfBtn.setAttribute("href", matchedPdfPath);
            readerPdfBtn.textContent = `📥 下載《${bookCode}》原始 PDF 原檔`;
        }

        readerContent.innerHTML = `
            <div style="padding: 10px; background: rgba(200,125,50,0.15); border-radius: 8px; margin-bottom: 12px; border-left: 4px solid var(--accent-color);">
              <strong>❶ 朱婕老師手稿原文：</strong><br>${desc}
            </div>
            <div style="padding: 10px; background: rgba(230,126,34,0.15); border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #e67e22;">
              <strong>❷ 印度 AYUSH 官方藥典 (API)：</strong><br>
              標準拉丁學名：<em>${latin || 'Eclipta prostrata (L.) L.'}</em><br>
              Rasa (味)：${rasa || '苦 (Tikta)'}<br>
              Virya (性)：${virya || '涼 (Sheeta)'}
            </div>
            <div style="padding: 10px; background: rgba(46,204,113,0.15); border-radius: 8px; border-left: 4px solid #27ae60;">
              <strong>❸ 華語/中醫性味歸經對照 (THP)：</strong><br>
              中藥對照：${tcm || '墨旱蓮 (歸肝腎經)'}
            </div>
        `;

        readerModal.style.display = "flex";
    }
}

function renderHerbs(herbs) {
    const container = document.getElementById("herbGrid");
    if (!container || !herbs) return;
    
    let html = "";
    herbs.forEach(item => {
        const isFav = favorites.some(f => f.id === item.id);
        html += `
        <div class="herb-card scroll-reveal" data-herb-id="${item.id}">
          <div>
            <div class="herb-header">
              <div>
                <div class="herb-name">${item.name}</div>
                <div class="herb-sanskrit">${item.sanskrit}</div>
              </div>
              <span class="badge-tag">${item.dosha}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.8rem;">
              ${item.desc}
            </p>
            <div style="margin-bottom: 0.8rem;">
              <span class="badge-tag" style="background: rgba(230, 126, 34, 0.15); color: #d35400;">🇮🇳 AYUSH API 認證</span>
              <span class="badge-tag">${item.rasa}</span>
              <span class="badge-tag">${item.virya}</span>
              <span class="badge-tag" style="background: rgba(46, 204, 113, 0.15); color: #27ae60;">🇹🇼 ${item.tcm}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="openReaderView('${item.name}', '${item.desc}', '${item.latin}', '${item.rasa}', '${item.virya}', '${item.tcm}', '${item.id}', 'SINGLE1')">
              🖼️ 圖文對照
            </button>
            <button class="btn-icon" onclick="toggleBookmark('${item.id}', '${item.name}')">
              ${isFav ? '❤️ 已收錄' : '🤍 收錄手帳'}
            </button>
            <button class="btn-icon" onclick="copyHerbLink('${item.id}', '${item.name}', '${item.desc}')">
              🔗 分享連結
            </button>
          </div>
        </div>
        `;
    });
    container.innerHTML = html;
}

function searchAndRender(query) {
    if (!query) {
        renderHerbs(globalData.herbs);
        return;
    }

    const container = document.getElementById("herbGrid");
    if (!container) return;

    const matchedHerbs = globalData.herbs.filter(h => 
        h.name.toLowerCase().includes(query) || 
        h.sanskrit.toLowerCase().includes(query) ||
        h.desc.toLowerCase().includes(query) ||
        h.tcm.toLowerCase().includes(query)
    );

    const matchedPages = globalData.pages.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.snippet.toLowerCase().includes(query) ||
        p.doc.toLowerCase().includes(query) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(query)))
    );

    let html = "";
    
    matchedHerbs.forEach(item => {
        const isFav = favorites.some(f => f.id === item.id);
        html += `
        <div class="herb-card scroll-reveal" style="border: 1.5px solid var(--accent-color);">
          <div>
            <div class="herb-header">
              <div>
                <div class="herb-name">🌿 ${item.name}</div>
                <div class="herb-sanskrit">${item.sanskrit}</div>
              </div>
              <span class="badge-tag">${item.dosha}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.8rem;">
              ${item.desc}
            </p>
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="openReaderView('${item.name}', '${item.desc}', '${item.latin}', '${item.rasa}', '${item.virya}', '${item.tcm}', '${item.id}', 'SINGLE1')">🖼️ 圖文對照</button>
            <button class="btn-icon" onclick="toggleBookmark('${item.id}', '${item.name}')">${isFav ? '❤️ 已收錄' : '🤍 收錄手帳'}</button>
            <button class="btn-icon" onclick="copyHerbLink('${item.id}', '${item.name}', '${item.desc}')">🔗 分享連結</button>
          </div>
        </div>
        `;
    });

    matchedPages.slice(0, 12).forEach(page => {
        const pdfPath = PDF_DOWNLOAD_MAP[page.doc] || "./pdf/單方草藥1-2.pdf";
        const tagsHtml = page.keywords && page.keywords.length > 0 
            ? `<div style="margin-bottom: 6px;">` + page.keywords.slice(0, 4).map(k => `<span class="badge-tag" style="background: rgba(155, 89, 182, 0.15); color: #a569bd; font-size: 0.75rem;">🏷️ ${k}</span>`).join(" ") + `</div>`
            : "";

        html += `
        <div class="herb-card scroll-reveal">
          <div>
            <div class="herb-header">
              <div>
                <div class="herb-name">📖 ${page.title} (${page.doc})</div>
                <div class="herb-sanskrit">頁面識別碼: ${page.id}</div>
              </div>
              <span class="badge-tag">全冊筆記條目</span>
            </div>
            ${tagsHtml}
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
              ${page.snippet.substring(0, 200)}...
            </p>
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="openReaderView('${page.title}', '${page.snippet.replace(/'/g, "")}', '', '', '', '', '${page.id}', '${page.doc}')">🖼️ 開啟圖文對照</button>
            <a href="${pdfPath}" target="_blank" class="btn-icon" style="text-decoration: none; text-align: center;">📥 下載《${page.doc}》PDF</a>
            <button class="btn-icon" onclick="copyHerbLink('q=${encodeURIComponent(page.title)}', '${page.title}', '${page.snippet}')">🔗 分享連結</button>
          </div>
        </div>
        `;
    });

    if (matchedHerbs.length === 0 && matchedPages.length === 0) {
        html = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">🔍 未搜尋到包含「${query}」的草藥或筆記頁面，請嘗試搜尋「旱蓮草」、「失眠」、「Vata」或「Triphala」</div>`;
    }

    container.innerHTML = html;
}

function copyHerbLink(queryOrId, title, desc) {
    const isParam = queryOrId.includes("=");
    const shareUrl = isParam 
        ? `${window.location.origin}${window.location.pathname}?${queryOrId}`
        : `${window.location.origin}${window.location.pathname}?herb=${queryOrId}`;
        
    const textToCopy = `🌿 《朱婕老師阿育吠陀開源知識庫 3.0》\n【條目】${title}\n【專屬閱讀網址】${shareUrl}\n\n(採 CC-BY-SA 4.0 國際創用 CC 開源授權)`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(`已成功複製《${title}》專屬獨立網址至剪貼簿！\n\n網址：${shareUrl}\n(發給朋友或貼到 FB/Line，對方點擊即可直接開啟該條目！)`);
    }).catch(err => {
        console.error("複製失敗", err);
    });
}

function toggleBookmark(id, title) {
    const idx = favorites.findIndex(f => f.id === id);
    if (idx >= 0) {
        favorites.splice(idx, 1);
        alert(`已從手帳中移除《${title}》`);
    } else {
        favorites.push({ id, title, time: new Date().toLocaleDateString() });
        alert(`已將《${title}》收錄至您的離線研習手帳！`);
    }
    localStorage.setItem("ayurveda_favs", JSON.stringify(favorites));
    updateFavBadge();
    renderHerbs(globalData.herbs);
}

function updateFavBadge() {
    const badge = document.getElementById("favCountBadge");
    if (badge) badge.textContent = favorites.length;
}

function renderFavoritesList() {
    const list = document.getElementById("favoritesList");
    if (!list) return;
    if (favorites.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">目前離線手帳尚無收錄項目，點擊卡片上的「🤍 收錄手帳」按鈕即可隨時典藏！</div>`;
        return;
    }
    let html = "";
    favorites.forEach(f => {
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div>
            <strong>🌿 ${f.title}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">(收錄於 ${f.time})</span>
          </div>
          <button class="btn-icon" style="max-width: 80px;" onclick="toggleBookmark('${f.id}', '${f.title}'); renderFavoritesList();">移除</button>
        </div>
        `;
    });
    list.innerHTML = html;
}

function copyHerbContent(title, text) {
    const attribution = `\n\n— 出處：朱婕老師阿育吠陀開源知識庫 3.0 (https://bertwang.github.io/ayurveda_vaidya/)\n(CC-BY-SA 4.0 創用 CC 開源授權)`;
    const fullText = text + attribution;
    
    navigator.clipboard.writeText(fullText).then(() => {
        alert(`已成功複製《${title}》講義片段至剪貼簿！（已自動帶入開源出處標註）`);
    }).catch(err => {
        console.error("複製失敗", err);
    });
}

function openApiDetails(herbId) {
    const refModal = document.getElementById("referencesModal");
    if (refModal) {
        refModal.style.display = "flex";
    }
}

function filterByGuna(guna) {
    if (guna === "all") {
        renderHerbs(globalData.herbs);
    } else {
        const filtered = globalData.herbs.filter(h => 
            h.desc.includes(guna) || h.dosha.includes(guna) || h.rasa.includes(guna) || h.virya.includes(guna)
        );
        renderHerbs(filtered);
    }
}
