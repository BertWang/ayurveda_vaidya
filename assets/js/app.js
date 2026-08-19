// app.js - 朱婕老師阿育吠陀開源知識庫 3.0 (全新重構版：單一狀態機、無衝突搜尋與劇院級手稿對照)

// 全域狀態管理 (Single Source of Truth)
const AppState = {
    globalData: { herbs: [], pages: [] },
    favorites: JSON.parse(localStorage.getItem("ayurveda_favs") || "[]"),
    query: "",
    activeVol: "all",
    activeCategory: "all",
    currentZoom: 1.0,
    activeTab: "notes"
};

// 10 大主題冊對照字典
const VOLUMES_MAP = {
    'all': '全部主題冊 (630 頁)',
    'BASICS': '📘 基礎介紹 (30 頁)',
    'CHANNEL_CARDS': '🎴 渠道小白卡 (46 頁)',
    'SINGLE1': '📗 單方草藥 一 (165 頁)',
    'SINGLE2': '📗 單方草藥 二 (31 頁)',
    'FORMULAS': '📙 配方草藥 (55 頁)',
    'DISEASE_HERBS': '📕 疾病與草藥 (61 頁)',
    'HOME': '📔 居家療法 (9 頁)',
    'CHANNEL_HEALING': '🌀 渠道療癒 (192 頁)',
    'DX1': '🩺 疾病診療 一 (26 頁)',
    'DX2': '🩺 疾病診療 二 (15 頁)'
};

// 備用預載草藥
const FALLBACK_HERBS = [
    {
        id: "bhringraj",
        name: "旱蓮草 (Bhringraj)",
        sanskrit: "Eclipta prostrata / 墨旱蓮",
        dosha: "Pitta ↓ / K ↓",
        rasa: "苦 (Tikta), 辛 (Katu)",
        virya: "涼 (Sheeta)",
        vipaka: "辛 (Katu)",
        tcm: "墨旱蓮 (甘酸寒，歸肝腎經)",
        desc: "朱婕老師筆記要點：頭皮養護第一聖藥，具平息火型體質 (Pitta) 炎熱、清肝明目、滋養髮根與鎮靜心靈之功效。",
        img_src: "./assets/images/scans/pages/SINGLE1_P0001.jpg",
        book_code: "SINGLE1-P0001"
    }
];

// 初始化
document.addEventListener("DOMContentLoaded", () => {
    console.log("🌿 朱婕老師阿育吠陀開源知識庫 3.0 —— 全新單一狀態機引擎啟動！");

    initVolumeFilterBar();
    updateFavBadge();

    // 載入資料庫
    fetch("./assets/js/herbs_db.json?t=" + Date.now())
        .then(res => {
            if (!res.ok) throw new Error("Fetch Error");
            return res.json();
        })
        .then(data => {
            AppState.globalData = data;
            const countBadge = document.getElementById("herbCountBadge");
            if (countBadge) {
                countBadge.textContent = `全冊 630 頁實體手稿 (繁體正體 ↔ 照片 1 對 1 忠實對照)`;
            }
            // 解析 URL query 參數，避免與初始渲染打架
            initUrlParamsAndRender();
        })
        .catch(err => {
            console.warn("⚠️ 採用備用草藥庫：", err);
            AppState.globalData = { herbs: FALLBACK_HERBS, pages: [] };
            initUrlParamsAndRender();
        });

    // 搜尋輸入監聽 (防抖處理)
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        let debounceTimer = null;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                AppState.query = e.target.value.trim();
                syncUrlParams();
                applyFilterAndRender();
            }, 120);
        });
    }

    // 20 Gunas 標籤監聽
    const gunaChips = document.querySelectorAll(".guna-chip[data-guna]");
    gunaChips.forEach(chip => {
        chip.addEventListener("click", () => {
            gunaChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const guna = chip.getAttribute("data-guna");
            AppState.activeCategory = guna;
            if (guna === "all") AppState.query = "";
            else AppState.query = guna;
            if (searchInput) searchInput.value = AppState.query;
            syncUrlParams();
            applyFilterAndRender();
        });
    });

    // 主題切換
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            themeBtn.textContent = newTheme === "light" ? "☀️ 淺色模式" : "🌙 深色模式";
        });
    }

    // Modal 綁定
    setupModal("openReferencesBtn", "referencesModal", "closeReferencesBtn");
    setupModal("openFavoritesBtn", "favoritesModal", "closeFavoritesBtn", renderFavoritesList);
    setupModal("openReaderBtn", "readerModal", "closeReaderBtn");
    setupModal("openSponsorBtn", "sponsorModal", "closeSponsorBtn");
});

// 初始化 10 大主題冊頂部過濾按鈕列
function initVolumeFilterBar() {
    const volContainer = document.getElementById("volumeFilterBar");
    if (!volContainer) return;

    volContainer.innerHTML = "";
    Object.entries(VOLUMES_MAP).forEach(([key, name]) => {
        const btn = document.createElement("button");
        btn.className = `vol-filter-btn ${key === AppState.activeVol ? 'active' : ''}`;
        btn.textContent = name;
        btn.onclick = () => filterByVolume(key);
        volContainer.appendChild(btn);
    });
}

// 依主題冊過濾
window.filterByVolume = function(volKey) {
    AppState.activeVol = volKey;
    
    // 更新按鈕樣式
    document.querySelectorAll(".vol-filter-btn").forEach(b => {
        b.classList.toggle("active", b.textContent.includes(VOLUMES_MAP[volKey]) || (volKey === 'all' && b.textContent.includes('全部')));
    });

    syncUrlParams();
    applyFilterAndRender();
};

// 解析 URL Query 參數
function initUrlParamsAndRender() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const vol = params.get("vol") || "all";

    AppState.query = q;
    AppState.activeVol = vol;

    const searchInput = document.getElementById("searchInput");
    if (searchInput && q) {
        searchInput.value = q;
    }

    if (vol !== "all") {
        document.querySelectorAll(".vol-filter-btn").forEach(b => {
            b.classList.toggle("active", b.textContent.includes(VOLUMES_MAP[vol]));
        });
    }

    applyFilterAndRender();
}

// 同步 URL 參數 (乾淨同步，絕不打架)
function syncUrlParams() {
    const params = new URLSearchParams();
    if (AppState.query) params.set("q", AppState.query);
    if (AppState.activeVol && AppState.activeVol !== "all") params.set("vol", AppState.activeVol);

    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    history.replaceState(null, "", newUrl);
}

// 單一核心過濾與渲染函數 (徹底解決競爭衝突)
function applyFilterAndRender() {
    const grid = document.getElementById("herbGrid");
    if (!grid) return;

    const allPages = AppState.globalData.pages || [];
    const allHerbs = AppState.globalData.herbs || [];

    const query = AppState.query.toLowerCase().trim();
    const vol = AppState.activeVol;

    // 1. 過濾手稿頁面
    let matchedPages = allPages.filter(p => {
        // 主題冊篩選
        if (vol !== "all" && p.doc !== vol) return false;

        // 搜尋詞篩選
        if (!query) return true;

        const pId = (p.id || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        const snippet = (p.snippet || "").toLowerCase();
        const doc = (p.doc || "").toLowerCase();
        const keywords = (p.keywords || []).join(" ").toLowerCase();
        const srotas = (p.rel_srotas || []).join(" ").toLowerCase();
        const dhatus = (p.rel_dhatus || []).join(" ").toLowerCase();
        const herbs = (p.rel_herbs || []).join(" ").toLowerCase();

        const fullText = `${pId} ${title} ${snippet} ${doc} ${keywords} ${srotas} ${dhatus} ${herbs}`;

        const tokens = query.split(/\s+/);
        return tokens.every(t => fullText.includes(t));
    });

    // 2. 過濾典籍草藥
    let matchedHerbs = [];
    if (vol === "all" || vol === "SINGLE1" || vol === "FORMULAS") {
        matchedHerbs = allHerbs.filter(h => {
            if (!query) return false; // 無搜尋時主推 630 頁手稿
            const name = (h.name || "").toLowerCase();
            const sanskrit = (h.sanskrit || "").toLowerCase();
            const tcm = (h.tcm || "").toLowerCase();
            const desc = (h.desc || "").toLowerCase();
            const full = `${name} ${sanskrit} ${tcm} ${desc}`;
            return query.split(/\s+/).every(t => full.includes(t));
        });
    }

    renderCardsUI(matchedHerbs, matchedPages, query);
}

// 渲染寬版高清晰卡片
function renderCardsUI(herbsList, pagesList, queryStr) {
    const grid = document.getElementById("herbGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const totalCount = herbsList.length + pagesList.length;
    const countBadge = document.getElementById("herbCountBadge");
    if (countBadge) {
        if (queryStr || AppState.activeVol !== 'all') {
            countBadge.textContent = `篩選結果：共找到 ${totalCount} 筆手稿講義與草藥`;
        } else {
            countBadge.textContent = `全冊 630 頁實體手稿 (繁體正體 ↔ 照片 1 對 1 忠實對照)`;
        }
    }

    if (totalCount === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1.5px solid var(--border-subtle);">
                <div style="font-size: 3rem; margin-bottom: 0.8rem;">🔍</div>
                <h3 style="color: var(--gold-light); font-size: 1.4rem; margin-bottom: 0.6rem;">未找到與「${queryStr || AppState.activeVol}」相符的手稿頁面</h3>
                <p style="color: var(--text-secondary); font-size: 1rem;">建議檢查搜尋字詞，或點選上方「全部主題冊」按鈕查看全冊 630 頁內容。</p>
            </div>
        `;
        return;
    }

    // 渲染手稿頁面卡片 (寬版大字體、直接展現實體原圖縮圖與純繁體正體筆記)
    pagesList.forEach(p => {
        const isFav = AppState.favorites.some(f => f.id === p.id);
        const card = document.createElement("div");
        card.className = "herb-card";
        card.style.borderColor = "rgba(245, 158, 11, 0.4)";

        const bookCode = p.id || "P0001";
        const displayTitle = p.title || "阿育吠陀手稿講義";
        const imgPath = p.raw_file_path || "./assets/images/scans/scan_single1.jpg";

        const srotasBadges = (p.rel_srotas || []).map(s => `<span class="badge-tag" style="cursor:pointer; background:rgba(245,158,11,0.2); color:#F59E0B;" onclick="filterByChannel('${s}')">🌀 ${s}</span>`).join(' ');
        const dhatusBadges = (p.rel_dhatus || []).map(d => `<span class="badge-tag" style="cursor:pointer; background:rgba(52,211,153,0.2); color:#34D399;" onclick="filterByChannel('${d}')">🫀 ${d}</span>`).join(' ');

        const highlightedSnippet = highlightQuery(p.snippet || "", queryStr);
        const htmlSnippet = parseMarkdownToHtml(highlightedSnippet);

        card.innerHTML = `
            <div style="display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap;">
                <!-- 左側縮圖 (點擊直達大尺寸預覽) -->
                <div style="width: 110px; height: 145px; background: #000; border-radius: 8px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 1.5px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; position: relative;" onclick="openPageDetail('${p.id}')" title="點擊開啟手稿對照視窗">
                    <img src="${imgPath}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9; transition: transform 0.3s ease;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); color: var(--notion-yellow); font-size: 0.72rem; text-align: center; padding: 2px;">🔍 放大原圖</div>
                </div>

                <!-- 右側標題與內容 -->
                <div style="flex: 1; min-width: 260px;">
                    <div class="herb-header" style="margin-bottom: 6px;">
                        <div>
                            <h3 class="herb-name" style="font-size: 1.25rem; margin: 0;">📜 ${highlightQuery(displayTitle, queryStr)}</h3>
                            <span class="herb-sanskrit" style="color: var(--text-muted); font-size: 0.85rem;">講義編碼: <strong>${bookCode}</strong> | 冊別: ${p.doc || 'SINGLE1'}</span>
                        </div>
                        <span class="badge-tag" style="background: var(--notion-yellow-bg); color: var(--notion-yellow);">${p.doc || '手稿'}</span>
                    </div>

                    ${(srotasBadges || dhatusBadges) ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0;">${srotasBadges} ${dhatusBadges}</div>` : ''}

                    <div class="snippet-box" style="margin: 8px 0; max-height: 180px;">
                        ${htmlSnippet}
                    </div>
                </div>
            </div>

            <div class="card-actions" style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn-icon" onclick="openPageDetail('${p.id}')">🔍 詳情對照</button>
                <button class="btn-icon" onclick="toggleFavorite('${p.id}', '${escapeJsString(displayTitle)}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 繁體 Markdown 解析器
function parseMarkdownToHtml(mdText) {
    if (!mdText) return '';
    let html = mdText;

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--notion-yellow);">$1</strong>');
    html = html.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08); color:var(--notion-yellow); padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>');
    html = html.replace(/^(?:#+|📌)\s*(.*$)/gim, '<h4 style="margin: 8px 0 4px 0; font-size:1.05rem;">📌 $1</h4>');

    html = html.replace(/\n/g, '<br>');
    return html;
}

// 關鍵字高亮
function highlightQuery(text, query) {
    if (!text || !query) return text;
    const tokens = query.toLowerCase().trim().split(/\s+/);
    let result = text;
    tokens.forEach(token => {
        if (!token || token.length < 1) return;
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        result = result.replace(regex, '<mark style="background: var(--notion-yellow); color: #000; font-weight: bold; padding: 1px 4px; border-radius: 4px;">$1</mark>');
    });
    return result;
}

// 快速點擊渠道標籤過濾
window.filterByChannel = function(channelName) {
    const clean = channelName.replace("渠道", "").replace("層", "").trim();
    AppState.query = clean;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = clean;
    syncUrlParams();
    applyFilterAndRender();
};

// 全域掛載原圖縮放控制器
window.currentReaderZoom = 1.0;

window.zoomReaderImage = function(factor) {
    const img = document.getElementById("readerImage");
    if (!img) return;
    window.currentReaderZoom = Math.min(Math.max(window.currentReaderZoom * factor, 0.6), 3.5);
    img.style.transform = `scale(${window.currentReaderZoom})`;
};

window.resetReaderImageZoom = function() {
    const img = document.getElementById("readerImage");
    if (!img) return;
    window.currentReaderZoom = 1.0;
    img.style.transform = "scale(1.0)";
};

window.toggleReaderImageZoom = function() {
    const img = document.getElementById("readerImage");
    if (!img) return;
    window.currentReaderZoom = (window.currentReaderZoom === 1.0) ? 1.75 : 1.0;
    img.style.transform = `scale(${window.currentReaderZoom})`;
};

// 開啟手稿對照視窗
window.openPageDetail = function(pageId) {
    const pageList = AppState.globalData.pages || [];
    const p = pageList.find(item => item.id === pageId) || pageList[0];
    if (!p) return;

    const readerTitle = document.getElementById("readerTitle");
    const readerImage = document.getElementById("readerImage");
    const readerImageTag = document.getElementById("readerImageTag");
    const readerImageFullLink = document.getElementById("readerImageFullLink");
    const modal = document.getElementById("readerModal");

    const displayTitle = p.title || "阿育吠陀手稿講義";
    if (readerTitle) readerTitle.textContent = `📜 ${displayTitle}`;

    const pageImg = p.raw_file_path || "./assets/images/scans/scan_single1.jpg";
    const bookCode = p.id || "P0001";

    if (readerImage) {
        readerImage.src = pageImg;
        window.resetReaderImageZoom();
    }
    if (readerImageTag) {
        readerImageTag.innerHTML = `📜 原稿識別碼: <strong>${bookCode}</strong> | 📁 實體圖檔: <code>${pageImg}</code>`;
    }
    if (readerImageFullLink) {
        readerImageFullLink.href = pageImg;
    }

    // 填入手稿對照內文
    const tabNotes = document.getElementById("tabContentNotes");
    if (tabNotes) {
        tabNotes.innerHTML = `
            <div style="font-size: 1.08rem; line-height: 1.95;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                    <h4 style="color:var(--gold-accent); margin:0; font-size: 1.2rem;">📜 朱婕老師親筆手稿純繁體逐字轉錄</h4>
                    <span class="badge-tag" style="background: rgba(245,158,11,0.25); color: var(--gold-light);">100% 繁體中醫對照</span>
                </div>
                <div style="background: rgba(15,23,42,0.75); padding: 18px 22px; border-radius: 10px; border: 1.5px solid rgba(245,158,11,0.3);">
                    ${parseMarkdownToHtml(p.snippet)}
                </div>
            </div>
        `;
    }

    // 填入藥典
    const tabPharm = document.getElementById("tabContentPharm");
    if (tabPharm) {
        const relatedHerbList = p.rel_herbs || ["無特定標註草藥"];
        tabPharm.innerHTML = `
            <div style="font-size: 1.05rem; line-height: 1.9;">
                <h4 style="color:var(--emerald-accent); margin-bottom: 10px; font-size: 1.2rem;">🌿 關聯草藥性味歸經 (API / 印度藥典)</h4>
                <p><strong>關聯草藥物種：</strong> ${relatedHerbList.join("、")}</p>
                <p><strong>對應體質 Dosha：</strong> ${(p.rel_doshas || []).join(" / ") || "Tridosha 平衡"}</p>
                <div style="margin-top: 14px; padding: 14px; background: rgba(245,158,11,0.14); border-left: 4px solid #F59E0B; border-radius: 8px;">
                    💡 提示：此頁面草藥經由朱婕老師手稿處方記載，對標印度 AYUSH API 國家藥典。
                </div>
            </div>
        `;
    }

    // 填入關聯鏈
    const tabLinks = document.getElementById("tabContentLinks");
    if (tabLinks) {
        const srotasBadges = (p.rel_srotas || []).map(s => `<span class="badge-tag" style="cursor:pointer; background:rgba(245,158,11,0.2); color:#F59E0B;" onclick="filterByChannel('${s}'); document.getElementById('readerModal').style.display='none';">🌀 ${s}</span>`).join(' ');
        const dhatusBadges = (p.rel_dhatus || []).map(d => `<span class="badge-tag" style="cursor:pointer; background:rgba(52,211,153,0.2); color:#34D399;" onclick="filterByChannel('${d}'); document.getElementById('readerModal').style.display='none';">🫀 ${d}</span>`).join(' ');

        tabLinks.innerHTML = `
            <div style="font-size: 1.05rem; line-height: 1.9;">
                <h4 style="color:#C4B5FD; margin-bottom: 10px; font-size: 1.2rem;">🔗 跨冊相鄰關聯知識鏈 (Relational Graph)</h4>
                <p style="margin-bottom: 10px;"><strong>🌀 關聯生理渠道 (Srotas)：</strong> ${srotasBadges || "無"}</p>
                <p style="margin-bottom: 10px;"><strong>🫀 關聯身體組織 (Dhatus)：</strong> ${dhatusBadges || "無"}</p>
            </div>
        `;
    }

    window.switchDetailTab('notes');
    if (modal) modal.style.display = "flex";
};

window.switchDetailTab = function(tabId) {
    const tabNotes = document.getElementById("tabContentNotes");
    const tabPharm = document.getElementById("tabContentPharm");
    const tabLinks = document.getElementById("tabContentLinks");

    const btnNotes = document.getElementById("btnTabNotes");
    const btnPharm = document.getElementById("btnTabPharm");
    const btnLinks = document.getElementById("btnTabLinks");

    [btnNotes, btnPharm, btnLinks].forEach(b => { if (b) b.classList.remove("active"); });
    [tabNotes, tabPharm, tabLinks].forEach(t => { if (t) t.style.display = "none"; });

    if (tabId === "pharm") {
        if (tabPharm) tabPharm.style.display = "block";
        if (btnPharm) btnPharm.classList.add("active");
    } else if (tabId === "links") {
        if (tabLinks) tabLinks.style.display = "block";
        if (btnLinks) btnLinks.classList.add("active");
    } else {
        if (tabNotes) tabNotes.style.display = "block";
        if (btnNotes) btnNotes.classList.add("active");
    }
};

window.toggleFavorite = function(id, name) {
    const idx = AppState.favorites.findIndex(f => f.id === id);
    if (idx >= 0) {
        AppState.favorites.splice(idx, 1);
    } else {
        AppState.favorites.push({ id, name, time: new Date().toLocaleString() });
    }
    localStorage.setItem("ayurveda_favs", JSON.stringify(AppState.favorites));
    updateFavBadge();
    applyFilterAndRender();
};

function updateFavBadge() {
    const badge = document.getElementById("favCountBadge");
    if (badge) badge.textContent = AppState.favorites.length;
}

function renderFavoritesList() {
    const list = document.getElementById("favoritesList");
    if (!list) return;
    if (AppState.favorites.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:2rem;">目前尚無收錄手稿，點擊卡片「❤️ 收錄手帳」即可加入。</p>`;
        return;
    }
    list.innerHTML = AppState.favorites.map(f => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.05); margin-bottom:8px; border-radius:8px;">
            <div>
                <strong>${f.name}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">(${f.time})</span>
            </div>
            <div>
                <button class="btn-icon" onclick="openPageDetail('${f.id}'); document.getElementById('favoritesModal').style.display='none';">🔍 查看</button>
                <button class="btn-icon" onclick="toggleFavorite('${f.id}', '${escapeJsString(f.name)}'); renderFavoritesList();">🗑️ 移除</button>
            </div>
        </div>
    `).join('');
}

function setupModal(openBtnId, modalId, closeBtnId, onOpenCallback) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            if (onOpenCallback) onOpenCallback();
            modal.style.display = "flex";
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
}

function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/"/g, '&quot;');
}
