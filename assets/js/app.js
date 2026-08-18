// app.js - 朱婕老師阿育吠陀開源知識庫 3.0 (2026 三頁籤 🔍 詳情對照 重構全量引擎)

let globalData = { herbs: [], pages: [] };
let favorites = JSON.parse(localStorage.getItem("ayurveda_favs") || "[]");

const SROTAS_SEARCH_MAP = {
    'Pranavaha': 'Pranavaha 呼吸 肺 氣喘 咳嗽 生命氣',
    'Annavaha': 'Annavaha 消化 食物 腸道 胃 食慾',
    'Udakavaha': 'Udakavaha 水份 體液 津液 飲水',
    'Raktavaha': 'Raktavaha 血液 肝 脾 涼血 排毒',
    'Mamsavaha': 'Mamsavaha 肌肉 蛋白質 體力',
    'Medovaha': 'Medovaha 脂肪 代謝 降脂 減重',
    'Asthivaha': 'Asthivaha 骨骼 關節 風濕 骨質',
    'Majjavaha': 'Majjavaha 神經 骨髓 腦 失眠 鎮靜 睡茄',
    'Shukravaha': 'Shukravaha 生殖 精氣 補益 刺蒺藜',
    'Artavaha': 'Artavaha 子宮 月經 婦科 天門冬 無憂樹',
    'Stanyavaha': 'Stanyavaha 乳汁 哺育 催乳 小茴香',
    'Purishavaha': 'Purishavaha 糞便 便秘 排泄 潤腸 訶子',
    'Mutravaha': 'Mutravaha 尿液 利尿 泌尿 車前子',
    'Svedavaha': 'Svedavaha 汗液 發汗 皮膚 薄荷',
    'Manovaha': 'Manovaha 心靈 神經 安神 焦慮',
    'Rasa': 'Rasa 血漿 津液 營養',
    'Rakta': 'Rakta 血液 紅素 肝',
    'Mamsa': 'Mamsa 肌肉 體力',
    'Meda': 'Meda 脂肪 代謝',
    'Asthi': 'Asthi 骨骼 關節',
    'Majja': 'Majja 神經 骨髓',
    'Shukra': 'Shukra 生殖 精氣'
};

const FALLBACK_HERBS = [
    {
        id: "bhringraj",
        name: "旱蓮草 (Bhringraj)",
        sanskrit: "Eclipta prostrata / 墨旱蓮",
        dosha: "Pitta ↓ / K ↓",
        latin: "Eclipta prostrata (L.) L.",
        rasa: "苦 (Tikta), 辛 (Katu)",
        virya: "涼 (Sheeta)",
        vipaka: "辛 (Katu)",
        tcm: "墨旱蓮 (甘酸寒，歸肝腎經)",
        desc: "朱婕老師筆記要點：頭皮養護第一聖藥，具平息火型體質 (Pitta) 炎熱、清肝明目、滋養髮根與鎮靜心靈之功效。",
        img_src: "./assets/images/scans/scan_single1.jpg",
        book_code: "SINGLE1-P0001",
        source_file: "docs/SINGLE1.md"
    },
    {
        id: "triphala",
        name: "三果實 (Triphala)",
        sanskrit: "Haritaki + Bibhitaki + Amalaki",
        dosha: "三體質平衡 (Tridoshic)",
        latin: "Formula: Phyllanthus emblica + Terminalia chebula",
        rasa: "五味兼具 (酸苦甘辛澀)",
        virya: "溫/平 (Anushna)",
        vipaka: "甘 (Madhura)",
        tcm: "三果實經典方 (歸肺、大腸、肝經)",
        desc: "朱婕老師筆記要點：阿育吠陀千古第一經典複方！由訶子、毛訶子與餘甘子三果組成，溫和排毒、促進消化與滋補強身。",
        img_src: "./assets/images/scans/scan_formulas.jpg",
        book_code: "FORMULAS-P0042",
        source_file: "docs/FORMULAS.md"
    },
    {
        id: "ashwagandha",
        name: "睡茄 / 印度人蔘 (Ashwagandha)",
        sanskrit: "Withania somnifera / 催眠睡茄",
        dosha: "Vata ↓ / K ↓",
        latin: "Withania somnifera (L.) Dunal",
        rasa: "苦 (Tikta), 澀 (Kashaya), 甘 (Madhura)",
        virya: "熱 (Ushna)",
        vipaka: "甘 (Madhura)",
        tcm: "印度人蔘 (甘溫，歸腎心脾經)",
        desc: "朱婕老師筆記要點：風型體質 (Vata) 神經緊張與失眠最佳滋補草藥，具強壯神經系統、對抗壓力與睡眠調理提升體能之效。",
        img_src: "./assets/images/scans/scan_home.jpg",
        book_code: "HOME-P0105",
        source_file: "docs/HOME.md"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    console.log("🌿 朱婕老師阿育吠陀開源知識庫 3.0 重構三頁籤【🔍 詳情對照 Modal】啟動！");
    
    initScrollReveal();
    updateFavBadge();

    fetch("./assets/js/herbs_db.json")
        .then(res => {
            if (!res.ok) throw new Error("CORS or HTTP Error");
            return res.json();
        })
        .then(data => {
            globalData = data;
            const countBadge = document.getElementById("herbCountBadge");
            if (countBadge) {
                countBadge.textContent = `全冊 630 頁手稿 (內容 ↔ 原文 ↔ 原檔 613 頁三位一體實體關聯完成)`;
            }
            renderAllPortalItems();
            checkUrlQueryParams();
        })
        .catch(err => {
            console.warn("⚠️ 採用預載備用草藥庫：", err);
            globalData = { herbs: FALLBACK_HERBS, pages: [] };
            renderAllPortalItems();
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

function parseMarkdownToHtml(mdText) {
    if (!mdText) return '';
    let html = mdText;

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--gold-accent);">$1</strong>');
    html = html.replace(/`(.*?)`/g, '<code style="background:rgba(245,158,11,0.15); color:#F59E0B; padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>');
    html = html.replace(/^(?:#+|📌)\s*(.*$)/gim, '<h4 style="color:var(--gold-light); margin: 8px 0 4px 0; font-family:\'Noto Serif TC\', serif; font-size:1.02rem;">📌 $1</h4>');
    html = html.replace(/💊\s*【處方條目\s*(\d+)】\s*(.*)/gi, '<div style="margin: 8px 0; padding: 10px 14px; background: rgba(16, 185, 129, 0.12); border-left: 4px solid #10B981; border-radius: 8px; font-size: 0.93rem; line-height: 1.6;"><strong style="color: #34D399; font-size:0.95rem;">💊 處方配方 $1：</strong> $2</div>');
    html = html.replace(/\n/g, '<br>');

    return html;
}

function switchDetailTab(tabId) {
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
}

function toggleMindMapCategory(cat) {
    const blockSrotas = document.getElementById("blockSrotas");
    const blockDhatus = document.getElementById("blockDhatus");

    const btnAll = document.getElementById("btnShowAllNodes");
    const btnSrotas = document.getElementById("btnShowSrotas");
    const btnDhatus = document.getElementById("btnShowDhatus");

    [btnAll, btnSrotas, btnDhatus].forEach(b => { if (b) b.classList.remove("active"); });

    if (cat === "srotas") {
        if (blockSrotas) blockSrotas.style.display = "block";
        if (blockDhatus) blockDhatus.style.display = "none";
        if (btnSrotas) btnSrotas.classList.add("active");
    } else if (cat === "dhatus") {
        if (blockSrotas) blockSrotas.style.display = "none";
        if (blockDhatus) blockDhatus.style.display = "block";
        if (btnDhatus) btnDhatus.classList.add("active");
    } else {
        if (blockSrotas) blockSrotas.style.display = "block";
        if (blockDhatus) blockDhatus.style.display = "block";
        if (btnAll) btnAll.classList.add("active");
    }
}

function renderAllPortalItems() {
    const herbList = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const pageList = (globalData.pages && globalData.pages.length > 0) ? globalData.pages.slice(0, 36) : [];
    renderMixedCards(herbList, pageList, `全資料關聯性展示 (全冊 613 條手稿與草藥對照)`);
}

function renderMixedCards(herbsList, pagesList, titleTag, queryStr = "") {
    const grid = document.getElementById("herbGrid");
    if (!grid) return;
    grid.style.opacity = "0.4";
    grid.style.transform = "translateY(6px)";
    grid.style.transition = "opacity 0.2s ease, transform 0.2s ease";

    setTimeout(() => {
        grid.innerHTML = "";

        if ((!herbsList || herbsList.length === 0) && (!pagesList || pagesList.length === 0)) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1.5px solid var(--border-subtle);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                    <h3 style="color: var(--gold-light); font-size: 1.3rem; margin-bottom: 0.5rem;">未找到與「${queryStr}」相關的草藥或講義頁面</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem;">請嘗試點擊思維地圖或搜尋其他關鍵字（例如：Pranavaha, 失眠, 便秘, 子宮, 發炎, 風濕, Triphala）</p>
                </div>
            `;
            grid.style.opacity = "1";
            grid.style.transform = "translateY(0)";
            return;
        }

        // 1. 渲染草藥典籍條目
        herbsList.forEach(herb => {
            const isFav = favorites.some(f => f.id === herb.id);
            const card = document.createElement("div");
            card.className = "herb-card scroll-reveal revealed";
            
            const herbName = herb.name_zh || herb.name || "";
            const descText = herb.desc || herb.description || herb.summary || herb.used_for || "";
            const descHtml = parseMarkdownToHtml(highlightQuery(descText, queryStr));

            card.innerHTML = `
                <div>
                    <div class="herb-header">
                        <div>
                            <h3 class="herb-name">${highlightQuery(herbName, queryStr)}</h3>
                            <span class="herb-sanskrit">${herb.sanskrit || herb.latin || ""}</span>
                        </div>
                        <span class="badge-tag">草藥典籍</span>
                    </div>
                    
                    <div style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.2rem; color: var(--text-primary);">
                        <p style="margin-bottom: 4px;"><strong>🌿 性味歸經:</strong> ${herb.rasa || "未標註"} | ${herb.virya || ""} | ${herb.vipaka || ""}</p>
                        <p style="margin-bottom: 4px;"><strong>🧘 Dosha 作用:</strong> ${herb.dosha || herb.dosha_effect || "平衡"}</p>
                        ${herb.tcm ? `<p style="margin-bottom: 4px;"><strong>☯️ 中醫歸經:</strong> ${herb.tcm}</p>` : ""}
                    </div>
                    
                    <div style="font-size: 0.9rem; color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 8px; margin-bottom: 1.2rem;">
                        ${descHtml}
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn-icon" onclick="openHerbDetail('${herb.id}')">🔍 詳情對照</button>
                    <button class="btn-icon" onclick="toggleFavorite('${herb.id}', '${escapeJsString(herbName)}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // 2. 渲染 613 頁手稿講義卡片
        pagesList.forEach(p => {
            const isFav = favorites.some(f => f.id === p.id);
            const card = document.createElement("div");
            card.className = "herb-card scroll-reveal revealed";
            card.style.borderColor = "var(--emerald-accent)";

            const pageImg = p.raw_file_path || "./assets/images/scans/scan_single1.jpg";
            const bookCode = p.doc ? `${p.doc}-${p.id || 'P001'}` : (p.id || "P001");
            const sourceFile = p.source_file || `docs/${p.doc || 'SINGLE1'}.md`;

            const srotasBadges = (p.rel_srotas || []).map(s => `<span class="badge-tag" style="cursor:pointer; background:rgba(245,158,11,0.2); color:#F59E0B; border-color:rgba(245,158,11,0.4);" onclick="filterByChannel('${s}', '${s}渠道')">🌀 ${s}</span>`).join(' ');
            const dhatusBadges = (p.rel_dhatus || []).map(d => `<span class="badge-tag" style="cursor:pointer; background:rgba(52,211,153,0.2); color:#34D399; border-color:rgba(52,211,153,0.4);" onclick="filterByChannel('${d}', '${d}層')">🫀 ${d}</span>`).join(' ');
            const herbsBadges  = (p.rel_herbs || []).map(h => `<span class="badge-tag" style="cursor:pointer; background:rgba(196,181,253,0.2); color:#C4B5FD; border-color:rgba(196,181,253,0.4);" onclick="searchAndRender('${h}')">🌿 ${h}</span>`).join(' ');

            const rawSnippet = p.snippet || "朱婕老師阿育吠陀手抄筆記轉錄內文...";
            const highlightedSnippet = highlightQuery(rawSnippet, queryStr);
            const htmlSnippet = parseMarkdownToHtml(highlightedSnippet);

            card.innerHTML = `
                <div>
                    <div class="herb-header">
                        <div>
                            <h3 class="herb-name" style="color: var(--emerald-accent); font-size: 1.15rem;">📜 ${highlightQuery(p.title || "手稿講義", queryStr)}</h3>
                            <span class="herb-sanskrit">講義碼: ${bookCode} | 📁 原檔: ${sourceFile}</span>
                        </div>
                        <span class="badge-tag" style="background: rgba(167, 139, 250, 0.2); color: #C4B5FD; border-color: rgba(167, 139, 250, 0.4);">手稿對照</span>
                    </div>

                    ${(srotasBadges || dhatusBadges || herbsBadges) ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">${srotasBadges} ${dhatusBadges} ${herbsBadges}</div>` : ''}

                    <div style="font-size: 0.92rem; color: var(--text-primary); background: rgba(0,0,0,0.4); padding: 12px 14px; border-radius: 10px; margin-bottom: 1rem; line-height: 1.7; max-height: 180px; overflow-y: auto;">
                        ${htmlSnippet}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="openPageDetail('${p.id}')">🔍 詳情對照 (三頁籤)</button>
                    <button class="btn-icon" onclick="toggleFavorite('${p.id}', '${escapeJsString(p.title || "")}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
                </div>
            `;
            grid.appendChild(card);
        });

        const countBadge = document.getElementById("herbCountBadge");
        if (countBadge) {
            countBadge.textContent = `${titleTag || '全量呈現'} (${herbsList.length} 個草藥條目 + ${pagesList.length} 頁內容與原檔關聯對照)`;
        }

        grid.style.opacity = "1";
        grid.style.transform = "translateY(0)";
    }, 120);
}

function searchAndRender(query) {
    const grid = document.getElementById("herbGrid");
    if (!grid) return;

    if (!query) {
        renderAllPortalItems();
        return;
    }

    const cleanQuery = query.toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/);

    const herbList = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const matchedHerbs = herbList.filter(h => {
        const text = `${h.name || ""} ${h.name_zh || ""} ${h.sanskrit || ""} ${h.latin || ""} ${h.tcm || ""} ${h.rasa || ""} ${h.virya || ""} ${h.vipaka || ""} ${h.dosha || ""} ${h.dosha_effect || ""} ${h.used_for || ""} ${h.summary || ""} ${h.desc || ""} ${h.description || ""}`.toLowerCase();
        return tokens.some(token => text.includes(token));
    });

    const pageList = globalData.pages || [];
    const matchedPages = pageList.filter(p => {
        const hasSrotas = (p.rel_srotas || []).some(s => tokens.some(t => s.toLowerCase().includes(t)));
        const hasDhatus = (p.rel_dhatus || []).some(d => tokens.some(t => d.toLowerCase().includes(t)));
        const hasHerbs  = (p.rel_herbs || []).some(h => tokens.some(t => h.toLowerCase().includes(t)));
        const text = `${p.title || ""} ${p.snippet || ""} ${(p.keywords || []).join(' ')} ${p.doc || ""}`.toLowerCase();
        return hasSrotas || hasDhatus || hasHerbs || tokens.some(token => text.includes(token));
    }).slice(0, 40);

    renderMixedCards(matchedHerbs, matchedPages, `關聯搜尋「${query}」：找到`, query);
}

function highlightQuery(text, query) {
    if (!text || !query) return text;
    const tokens = query.toLowerCase().trim().split(/\s+/);
    let result = text;
    tokens.forEach(token => {
        if (!token || token.length < 2) return;
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        result = result.replace(regex, '<mark style="background: #F59E0B; color: #000; font-weight: bold; padding: 1px 4px; border-radius: 4px;">$1</mark>');
    });
    return result;
}

function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/"/g, '&quot;');
}

function filterByGuna(guna) {
    if (guna === "all") {
        renderAllPortalItems();
        return;
    }

    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const pageList = globalData.pages || [];

    const filteredHerbs = list.filter(h => {
        const text = `${h.rasa || ""} ${h.virya || ""} ${h.vipaka || ""} ${h.dosha || ""} ${h.dosha_effect || ""} ${h.desc || ""}`.toLowerCase();
        return text.includes(guna.toLowerCase());
    });

    const filteredPages = pageList.filter(p => {
        const text = `${p.title || ""} ${p.snippet || ""} ${(p.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(guna.toLowerCase());
    }).slice(0, 30);

    renderMixedCards(filteredHerbs, filteredPages, `Guna 屬性「${guna}」關聯`, guna);
}

function filterByChannel(channelKey, displayName) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.value = displayName || channelKey;
    }
    
    const herbsSec = document.getElementById("herbs");
    if (herbsSec) {
        herbsSec.scrollIntoView({ behavior: 'smooth' });
    }

    const keyLower = channelKey.toLowerCase();
    const herbList = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const pageList = globalData.pages || [];

    const matchedHerbs = herbList.filter(h => {
        const text = `${h.name || ""} ${h.name_zh || ""} ${h.sanskrit || ""} ${h.latin || ""} ${h.tcm || ""} ${h.rasa || ""} ${h.virya || ""} ${h.vipaka || ""} ${h.dosha || ""} ${h.dosha_effect || ""} ${h.used_for || ""} ${h.summary || ""} ${h.desc || ""} ${h.description || ""}`.toLowerCase();
        return text.includes(keyLower);
    });

    const matchedPages = pageList.filter(p => {
        const hasSrotas = (p.rel_srotas || []).some(s => s.toLowerCase() === keyLower);
        const hasDhatus = (p.rel_dhatus || []).some(d => d.toLowerCase() === keyLower);
        const hasHerbs  = (p.rel_herbs || []).some(h => h.toLowerCase() === keyLower);
        const text = `${p.title || ""} ${p.snippet || ""} ${(p.keywords || []).join(' ')} ${p.doc || ""}`.toLowerCase();
        return hasSrotas || hasDhatus || hasHerbs || text.includes(keyLower);
    }).slice(0, 40);

    renderMixedCards(matchedHerbs, matchedPages, `全資料關聯「${displayName || channelKey}」：找到`, channelKey);
    injectDynamicSEO(`《朱婕老師阿育吠陀學習路徑：${displayName}》- 知識庫 3.0`, `從朱婕老師手稿《${displayName}》出發擴展延伸之對應單方草藥與講義處方`, window.location.href);
}

// 三頁籤 🔍 詳情對照重構 Modal 開啟函數
function openPageDetail(pageId) {
    const pageList = globalData.pages || [];
    const p = pageList.find(item => item.id === pageId) || pageList[0];
    
    const readerTitle = document.getElementById("readerTitle");
    const readerImage = document.getElementById("readerImage");
    const readerImageTag = document.getElementById("readerImageTag");
    const modal = document.getElementById("readerModal");

    if (readerTitle) readerTitle.textContent = `📜 ${p.title || "手稿講義"} 詳情對照`;

    const pageImg = p.raw_file_path || "./assets/images/scans/scan_single1.jpg";
    const bookCode = p.doc ? `${p.doc}-${p.id || 'P001'}` : (p.id || "P001");
    const sourcePath = p.source_file || `docs/${p.doc || 'SINGLE1'}.md`;

    if (readerImage) readerImage.src = pageImg;
    if (readerImageTag) readerImageTag.innerHTML = `📜 原稿識別碼: <strong>${bookCode}</strong> | 📁 原始檔: <code>${sourcePath}</code>`;

    // 1. 填入 Tab 1: 朱婕老師筆記手稿對照
    const tabNotes = document.getElementById("tabContentNotes");
    if (tabNotes) {
        tabNotes.innerHTML = `
            <div style="font-size: 0.95rem; line-height: 1.8;">
                <h4 style="color:var(--gold-accent); margin-bottom: 8px;">📜 手稿轉錄原文與處方卡片</h4>
                ${parseMarkdownToHtml(p.snippet)}
            </div>
        `;
    }

    // 2. 填入 Tab 2: 經典草藥性味歸經對照
    const tabPharm = document.getElementById("tabContentPharm");
    if (tabPharm) {
        const relatedHerbList = p.rel_herbs || ["無特定標註草藥"];
        tabPharm.innerHTML = `
            <div style="font-size: 0.93rem; line-height: 1.8;">
                <h4 style="color:var(--emerald-accent); margin-bottom: 8px;">🌿 關聯草藥性味歸經 (API / 藥典)</h4>
                <p><strong>關聯草藥物種：</strong> ${relatedHerbList.join("、")}</p>
                <p><strong>對應體質 Dosha：</strong> ${(p.rel_doshas || []).join(" / ") || "Tridosha 平衡"}</p>
                <div style="margin-top: 10px; padding: 10px; background: rgba(245,158,11,0.12); border-left: 3px solid #F59E0B; border-radius: 6px;">
                    💡 提示：此頁面草藥經由朱婕老師手稿處方記載，對標印度 AYUSH API 國家藥典。
                </div>
            </div>
        `;
    }

    // 3. 填入 Tab 3: 跨冊別相鄰關聯知識鏈
    const tabLinks = document.getElementById("tabContentLinks");
    if (tabLinks) {
        const srotasBadges = (p.rel_srotas || []).map(s => `<span class="badge-tag" style="cursor:pointer; background:rgba(245,158,11,0.2); color:#F59E0B;" onclick="filterByChannel('${s}', '${s}渠道'); document.getElementById('readerModal').style.display='none';">🌀 ${s}</span>`).join(' ');
        const dhatusBadges = (p.rel_dhatus || []).map(d => `<span class="badge-tag" style="cursor:pointer; background:rgba(52,211,153,0.2); color:#34D399;" onclick="filterByChannel('${d}', '${d}層'); document.getElementById('readerModal').style.display='none';">🫀 ${d}</span>`).join(' ');
        const relPagesBadges = (p.rel_pages || []).map(pid => `<span class="badge-tag" style="cursor:pointer; background:rgba(196,181,253,0.2); color:#C4B5FD;" onclick="openPageDetail('${pid}')">📜 ${pid}</span>`).join(' ');

        tabLinks.innerHTML = `
            <div style="font-size: 0.93rem; line-height: 1.8;">
                <h4 style="color:#C4B5FD; margin-bottom: 8px;">🔗 跨冊相鄰關聯知識鏈 (Relational Graph)</h4>
                <p style="margin-bottom: 8px;"><strong>🌀 關聯生理渠道 (Srotas)：</strong> ${srotasBadges || "無"}</p>
                <p style="margin-bottom: 8px;"><strong>🫀 關聯身體組織 (Dhatus)：</strong> ${dhatusBadges || "無"}</p>
                <p style="margin-bottom: 8px;"><strong>📜 跨冊相鄰關聯頁面 (rel_pages)：</strong> ${relPagesBadges || "無"}</p>
            </div>
        `;
    }

    // 預設選取第一個 Tab (Notes)
    switchDetailTab('notes');

    if (modal) modal.style.display = "flex";
}

function openHerbDetail(herbId) {
    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const herb = list.find(h => h.id === herbId) || list[0];
    const descText = herb.desc || herb.description || herb.summary || herb.used_for || "";
    const herbName = herb.name_zh || herb.name || "";
    
    // 呼叫彈窗
    openPageDetail(herb.book_code || "SINGLE1-P0001");
}

function toggleFavorite(id, name) {
    const idx = favorites.findIndex(f => f.id === id);
    if (idx >= 0) {
        favorites.splice(idx, 1);
    } else {
        favorites.push({ id, name, time: new Date().toLocaleString() });
    }
    localStorage.setItem("ayurveda_favs", JSON.stringify(favorites));
    updateFavBadge();
}

function updateFavBadge() {
    const badge = document.getElementById("favCountBadge");
    if (badge) badge.textContent = favorites.length;
}

function renderFavoritesList() {
    const listDiv = document.getElementById("favoritesList");
    if (!listDiv) return;
    if (favorites.length === 0) {
        listDiv.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">尚未收錄任何草藥或講義頁面。</div>`;
        return;
    }
    listDiv.innerHTML = favorites.map(f => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.06); border-radius: 10px;">
            <span>🌿 <strong>${f.name}</strong> <small style="color: var(--text-muted);">(${f.time})</small></span>
            <button onclick="toggleFavorite('${f.id}', '${f.name}'); renderFavoritesList();" style="background: none; border: none; color: #EF4444; cursor: pointer; font-weight: bold;">❌ 移除</button>
        </div>
    `).join("");
}

function setupModal(openBtnId, modalId, closeBtnId, onOpenCallback) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);

    if (openBtn && modal) {
        openBtn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "flex";
            if (onOpenCallback) onOpenCallback();
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

function injectDynamicSEO(title, description, url) {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
}

function checkUrlQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = q;
        searchAndRender(q.toLowerCase().trim());
    }
}

function initScrollReveal() {
    const reveals = document.querySelectorAll(".scroll-reveal");
    reveals.forEach(el => el.classList.add("revealed"));
}
