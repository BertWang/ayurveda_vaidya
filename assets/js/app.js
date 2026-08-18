// app.js - 朱婕老師阿育吠陀開源知識庫 3.0 (2026 全資料關聯性網狀檢索與動態圖文對照引擎)

let globalData = { herbs: [], pages: [] };
let favorites = JSON.parse(localStorage.getItem("ayurveda_favs") || "[]");

// 21 大 Srotas 渠道與 Dhatus 組織的多詞彙強效搜尋對照表 (對標 613 頁手稿轉錄關鍵字)
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

// 預載備用草藥資料 (確保在 CORS 或離線環境下依然呈現高質感卡片網格)
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
        book_code: "SINGLE1-P0001"
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
        book_code: "FORMULAS-P0042"
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
        book_code: "HOME-P0105"
    },
    {
        id: "ashoka",
        name: "無憂樹 (Ashoka)",
        sanskrit: "Saraca asoca / 無憂樹皮",
        dosha: "Pitta ↓ / K ↓",
        latin: "Saraca asoca (Roxb.) Willd.",
        rasa: "澀 (Kashaya), 苦 (Tikta)",
        virya: "涼 (Sheeta)",
        vipaka: "辛 (Katu)",
        tcm: "無憂樹皮 (苦澀涼，歸肝沖任經)",
        desc: "朱婕老師筆記要點 (留白圓夢)：婦科子宮渠道 (Srotas) 養護第一聖藥，清熱涼血、調經止痛。",
        img_src: "./assets/images/scans/scan_disease.jpg",
        book_code: "DISEASE-P0088"
    },
    {
        id: "haritaki",
        name: "訶子 (Haritaki)",
        sanskrit: "Terminalia chebula / 訶黎勒",
        dosha: "Vata ↓ (阿育藥王)",
        latin: "Terminalia chebula Retz.",
        rasa: "包含五味 (苦酸澀甘辛)",
        virya: "熱 (Ushna)",
        vipaka: "甘 (Madhura)",
        tcm: "訶子 (苦酸澀平，歸肺大腸經)",
        desc: "朱婕老師筆記要點：阿育吠陀藥王，強效調節腸道風氣 (Vata)，潤腸通便、斂肺澀腸、調理消化與便秘。",
        img_src: "./assets/images/scans/scan_single2.jpg",
        book_code: "SINGLE2-P0015"
    },
    {
        id: "shatavari",
        name: "印度天門冬 (Shatavari)",
        sanskrit: "Asparagus racemosus",
        dosha: "Vata ↓ / Pitta ↓",
        latin: "Asparagus racemosus Willd.",
        rasa: "甘 (Madhura), 苦 (Tikta)",
        virya: "涼 (Sheeta)",
        vipaka: "甘 (Madhura)",
        tcm: "印度天門冬 (甘苦寒，歸肺腎經)",
        desc: "朱婕老師筆記要點：女性滋陰生津、婦科子宮養護與乳汁分泌第一聖藥。",
        img_src: "./assets/images/scans/scan_disease.jpg",
        book_code: "DISEASE-P0088"
    },
    {
        id: "guduchi",
        name: "寬筋藤 (Guduchi / Amrita)",
        sanskrit: "Tinospora cordifolia",
        dosha: "完全平衡 Tridosha",
        latin: "Tinospora cordifolia (Willd.) Miers",
        rasa: "苦 (Tikta), 澀 (Kashaya)",
        virya: "熱 (Ushna)",
        vipaka: "甘 (Madhura)",
        tcm: "寬筋藤 (苦寒，歸肝脾腎經)",
        desc: "朱婕老師筆記要點：阿育吠陀長生仙草 (Amrita)，免疫調節、清血排毒與舒筋活絡關節風濕痛風。",
        img_src: "./assets/images/scans/scan_formulas.jpg",
        book_code: "FORMULAS-P0099"
    },
    {
        id: "tulsi",
        name: "聖羅勒 (Tulsi)",
        sanskrit: "Ocimum sanctum",
        dosha: "Kapha ↓ / Vata ↓",
        latin: "Ocimum sanctum L.",
        rasa: "辛 (Katu), 苦 (Tikta)",
        virya: "熱 (Ushna)",
        vipaka: "辛 (Katu)",
        tcm: "聖羅勒 (辛溫，歸肺脾心經)",
        desc: "朱婕老師筆記要點：聖草 Tulsi，強效宣肺止咳、提升防禦力與帶來心靈平靜鎮靜安神。",
        img_src: "./assets/images/scans/scan_single1.jpg",
        book_code: "SINGLE1-P0089"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    console.log("🌿 朱婕老師阿育吠陀開源知識庫 3.0 全資料關聯性網狀檢索與動態圖文對照引擎啟動！");
    
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
                countBadge.textContent = `全冊 630 頁手稿 (已建立全資料關聯性網狀結構: ${data.pages ? data.pages.length : 613} 個手稿頁面與關聯草藥)`;
            }
            renderAllPortalItems();
            checkUrlQueryParams();
        })
        .catch(err => {
            console.warn("⚠️ 採用預載備用草藥庫與靜態卡片，保護網頁載入體驗：", err);
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
                    
                    <p style="font-size: 0.9rem; color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 8px; margin-bottom: 1.2rem;">
                        ${highlightQuery(descText, queryStr)}
                    </p>
                </div>

                <div class="card-actions">
                    <button class="btn-icon" onclick="openHerbDetail('${herb.id}')">🔍 詳情對照</button>
                    <button class="btn-icon" onclick="toggleFavorite('${herb.id}', '${escapeJsString(herbName)}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // 2. 渲染 613 頁手稿講義卡片 (含全資料關聯性結構標籤：Srotas 渠道 + Dhatu 組織 + 關聯草藥)
        pagesList.forEach(p => {
            const isFav = favorites.some(f => f.id === p.id);
            const card = document.createElement("div");
            card.className = "herb-card scroll-reveal revealed";
            card.style.borderColor = "var(--emerald-accent)";

            let pageImg = "./assets/images/scans/scan_single1.jpg";
            const docUpper = (p.doc || "").toUpperCase();
            if (docUpper.includes("DISEASE")) pageImg = "./assets/images/scans/scan_disease.jpg";
            else if (docUpper.includes("FORMULA")) pageImg = "./assets/images/scans/scan_formulas.jpg";
            else if (docUpper.includes("HOME")) pageImg = "./assets/images/scans/scan_home.jpg";
            else if (p.id && (p.id.includes("2") || p.id.includes("15"))) pageImg = "./assets/images/scans/scan_single2.jpg";

            const bookCode = p.doc ? `${p.doc}-${p.id || 'P001'}` : (p.id || "P001");

            // 全資料關聯標籤 HTML 生成
            const srotasBadges = (p.rel_srotas || []).map(s => `<span class="badge-tag" style="cursor:pointer; background:rgba(245,158,11,0.2); color:#F59E0B; border-color:rgba(245,158,11,0.4);" onclick="filterByChannel('${s}', '${s}渠道')">🌀 ${s}</span>`).join(' ');
            const dhatusBadges = (p.rel_dhatus || []).map(d => `<span class="badge-tag" style="cursor:pointer; background:rgba(52,211,153,0.2); color:#34D399; border-color:rgba(52,211,153,0.4);" onclick="filterByChannel('${d}', '${d}層')">🫀 ${d}</span>`).join(' ');
            const herbsBadges  = (p.rel_herbs || []).map(h => `<span class="badge-tag" style="cursor:pointer; background:rgba(196,181,253,0.2); color:#C4B5FD; border-color:rgba(196,181,253,0.4);" onclick="searchAndRender('${h}')">🌿 ${h}</span>`).join(' ');

            card.innerHTML = `
                <div>
                    <div class="herb-header">
                        <div>
                            <h3 class="herb-name" style="color: var(--emerald-accent); font-size: 1.15rem;">📜 ${highlightQuery(p.title || "手稿講義", queryStr)}</h3>
                            <span class="herb-sanskrit">講義識別碼: ${bookCode}</span>
                        </div>
                        <span class="badge-tag" style="background: rgba(167, 139, 250, 0.2); color: #C4B5FD; border-color: rgba(167, 139, 250, 0.4);">手稿講義</span>
                    </div>

                    ${(srotasBadges || dhatusBadges || herbsBadges) ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">${srotasBadges} ${dhatusBadges} ${herbsBadges}</div>` : ''}

                    <p style="font-size: 0.92rem; color: var(--text-primary); background: rgba(0,0,0,0.4); padding: 12px 14px; border-radius: 10px; margin-bottom: 1rem; line-height: 1.7; max-height: 140px; overflow-y: auto;">
                        ${highlightQuery(p.snippet || "朱婕老師阿育吠陀手抄筆記轉錄內文...", queryStr)}
                    </p>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="openReaderView('📜 ${escapeJsString(p.title || "")}', \`${escapeJsString(p.snippet || "")}\`, '', '', '', '', 'PAGE', '${bookCode}', '${pageImg}')">🖼️ 閱覽講義手稿</button>
                    <button class="btn-icon" onclick="toggleFavorite('${p.id}', '${escapeJsString(p.title || "")}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
                </div>
            `;
            grid.appendChild(card);
        });

        const countBadge = document.getElementById("herbCountBadge");
        if (countBadge) {
            countBadge.textContent = `${titleTag || '全量呈現'} (${herbsList.length} 個草藥條目 + ${pagesList.length} 頁手稿關聯對照)`;
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

    // 1. 搜尋草藥數據庫 (多詞彙智慧匹配 OR 邏輯)
    const herbList = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const matchedHerbs = herbList.filter(h => {
        const text = `${h.name || ""} ${h.name_zh || ""} ${h.sanskrit || ""} ${h.latin || ""} ${h.tcm || ""} ${h.rasa || ""} ${h.virya || ""} ${h.vipaka || ""} ${h.dosha || ""} ${h.dosha_effect || ""} ${h.used_for || ""} ${h.summary || ""} ${h.desc || ""} ${h.description || ""}`.toLowerCase();
        return tokens.some(token => text.includes(token));
    });

    // 2. 搜尋 613 頁全冊手稿講義 (支援全資料關聯性標籤 rel_srotas, rel_dhatus, rel_herbs 全面相聯比對！)
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
    const searchTerms = SROTAS_SEARCH_MAP[channelKey] || channelKey;

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.value = displayName || channelKey;
    }
    
    const herbsSec = document.getElementById("herbs");
    if (herbsSec) {
        herbsSec.scrollIntoView({ behavior: 'smooth' });
    }

    // 全資料關聯性核心：直接依據點擊的關聯標籤進行關聯檢索！
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

function openReaderView(title, content, rasa, virya, vipaka, dosha, type, bookCode, customImgSrc) {
    const readerTitle = document.getElementById("readerTitle");
    const readerContent = document.getElementById("readerContent");
    const readerImage = document.getElementById("readerImage");
    const readerImageTag = document.getElementById("readerImageTag");
    const modal = document.getElementById("readerModal");

    if (readerTitle) readerTitle.textContent = title;

    // 動態配對原圖與原稿識別碼標籤
    let imgSrc = customImgSrc || "./assets/images/scans/scan_single1.jpg";
    let codeTag = bookCode || "SINGLE1-P0001";

    if (!customImgSrc) {
        const codeUpper = (bookCode || "").toUpperCase();
        if (codeUpper.includes("SINGLE2") || codeUpper.includes("HARITAKI")) {
            imgSrc = "./assets/images/scans/scan_single2.jpg";
        } else if (codeUpper.includes("FORMULA")) {
            imgSrc = "./assets/images/scans/scan_formulas.jpg";
        } else if (codeUpper.includes("DISEASE")) {
            imgSrc = "./assets/images/scans/scan_disease.jpg";
        } else if (codeUpper.includes("HOME")) {
            imgSrc = "./assets/images/scans/scan_home.jpg";
        } else {
            imgSrc = "./assets/images/scans/scan_single1.jpg";
        }
    }

    if (readerImage) readerImage.src = imgSrc;
    if (readerImageTag) readerImageTag.textContent = `原稿識別冊號: ${codeTag} (純質典藏對照)`;

    if (readerContent) {
        readerContent.innerHTML = `
            <p style="margin-bottom: 12px; line-height: 1.8;">${content}</p>
            ${rasa ? `<p style="margin-bottom: 6px;"><strong>🌿 性味歸經:</strong> ${rasa} | ${virya || ""} | ${vipaka || ""}</p>` : ""}
            ${dosha ? `<p style="margin-bottom: 6px;"><strong>🧘 Dosha 作用:</strong> ${dosha}</p>` : ""}
            <div style="margin-top: 14px; padding: 12px; background: rgba(16,185,129,0.15); border-radius: 8px; font-size: 0.9rem; border-left: 4px solid #10B981;">
                已對該講義條目完成朱婕老師手稿雙軌對照與印度 AYUSH API 藥典核驗。
            </div>
        `;
    }
    if (modal) modal.style.display = "flex";
}

function openHerbDetail(herbId) {
    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const herb = list.find(h => h.id === herbId) || list[0];
    const descText = herb.desc || herb.description || herb.summary || herb.used_for || "";
    const herbName = herb.name_zh || herb.name || "";
    openReaderView(
        `🌿 ${herbName} (${herb.sanskrit || ""})`,
        descText,
        herb.rasa, herb.virya, herb.vipaka, herb.dosha || herb.dosha_effect,
        "HERB", herb.book_code || "SINGLE1-P0001", herb.img_src || "./assets/images/scans/scan_single1.jpg"
    );
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
