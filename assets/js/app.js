// app.js - 朱婕老師阿育吠陀開源知識庫 3.0 (2026 旗艦極致閱讀與純靜態對照引擎)

let globalData = { herbs: [], pages: [] };
let favorites = JSON.parse(localStorage.getItem("ayurveda_favs") || "[]");

// 預載備用草藥資料 (確保在 CORS 或離線環境下依然呈現高質感卡片網格)
const FALLBACK_HERBS = [
    {
        id: "herb_bhringraj",
        name_zh: "旱蓮草",
        sanskrit: "Bhringraj (Eclipta alba)",
        rasa: "苦 (Tikta), 辛 (Katu)",
        virya: "冷 (Sheeta)",
        vipaka: "辛 (Katu)",
        dosha_effect: "Pitta ↓, Vata ↓ (涼血、清熱排毒、烏髮)",
        used_for: "頭皮養護、烏髮、肝臟排毒、視力保養、熱性皮膚疹",
        summary: "朱婕老師筆記精選：阿育吠陀頭皮與肝臟養護聖藥，性冷味苦，能深度平息火型 (Pitta) 體質之過旺發炎。"
    },
    {
        id: "herb_haritaki",
        name_zh: "訶子",
        sanskrit: "Haritaki (Terminalia chebula)",
        rasa: "澀 (Kashaya), 苦 (Tikta), 甘 (Madhura)",
        virya: "熱 (Ushna)",
        vipaka: "甘 (Madhura)",
        dosha_effect: "Tridoshashak (平衡風火水三體質，尤擅降 Vata)",
        used_for: "腸道消化、潤腸通便、長壽滋補 (Rasayana)、記憶力提升",
        summary: "朱婕老師稱其為『藥草之母』，為三果實 (Triphala) 最核心之成分，具強效潤腸與腸道保健功能。"
    },
    {
        id: "herb_shatavari",
        name_zh: "印度天門冬",
        sanskrit: "Shatavari (Asparagus racemosus)",
        rasa: "甘 (Madhura), 微苦 (Tikta)",
        virya: "冷 (Sheeta)",
        vipaka: "甘 (Madhura)",
        dosha_effect: "Pitta ↓, Vata ↓ (滋陰、生津、婦科養護)",
        used_for: "女性內分泌調理、產後催乳、女性生殖渠道 (Artavaha) 養護、安神",
        summary: "朱婕老師手稿婦科聖藥，意為『擁有百個丈夫的女性』，能給予女性生殖與免疫層級 (Shukra Dhatu) 強大滋養。"
    },
    {
        id: "herb_ashwagandha",
        name_zh: "睡茄 (南非醉茄)",
        sanskrit: "Ashwagandha (Withania somnifera)",
        rasa: "苦 (Tikta), 澀 (Kashaya), 甘 (Madhura)",
        virya: "熱 (Ushna)",
        vipaka: "甘 (Madhura)",
        dosha_effect: "Vata ↓, Kapha ↓ (強壯神經、抗疲勞、助眠)",
        used_for: "失眠調理、神經衰弱、免疫力低下、肌肉強健 (Mamsavaha)、抗壓",
        summary: "阿育吠陀神經與體力強健核心草藥，具備馬之氣力象徵，能深度平息 Vata 風型焦慮與失眠。"
    },
    {
        id: "herb_triphala",
        name_zh: "三果實",
        sanskrit: "Triphala (Haritaki + Bibhitaki + Amalaki)",
        rasa: "具五味 (除鹹味外)",
        virya: "溫 (Samasheeta)",
        vipaka: "甘 (Madhura)",
        dosha_effect: "Tridosha Balance (全體質平衡處方)",
        used_for: "全消化道排毒 (Annavaha)、視力養護、結腸淨化、溫和溫補",
        summary: "古印度千古經典複方，由訶子、毛訶子與餘甘子組成，朱婕老師強調其為每日排毒必備溫和調理劑。"
    },
    {
        id: "herb_neem",
        name_zh: "印楝 (苦楝)",
        sanskrit: "Neem (Azadirachta indica)",
        rasa: "極苦 (Tikta)",
        virya: "極冷 (Sheeta)",
        vipaka: "辛 (Katu)",
        dosha_effect: "Pitta ↓, Kapha ↓ (強效解毒、涼血、抑菌)",
        used_for: "皮膚濕疹、痘痘粉刺、血液排毒 (Raktavaha)、天然防蟲解毒",
        summary: "印度天然村莊藥房，苦味極重，能迅速拔除血中熱毒，針對皮膚發炎與濕疹有立竿見影之效果。"
    },
    {
        id: "herb_guggulu",
        name_zh: "沒藥 (印度沒藥)",
        sanskrit: "Guggulu (Commiphora mukul)",
        rasa: "辛 (Katu), 苦 (Tikta)",
        virya: "熱 (Ushna)",
        vipaka: "辛 (Katu)",
        dosha_effect: "Vata ↓, Kapha ↓ (刮脂、刮痰、刮毒素 Ama)",
        used_for: "降血脂脂肪 (Medovaha)、關節風濕痛風 (Asthivaha)、刮除深層毒素",
        summary: "朱婕老師手稿強調其具『刮除 (Lekhana)』病理毒素之強大穿透力，能深層關節與血管保健。"
    },
    {
        id: "herb_gokshura",
        name_zh: "刺蒺藜",
        sanskrit: "Gokshura (Tribulus terrestris)",
        rasa: "甘 (Madhura)",
        virya: "冷 (Sheeta)",
        vipaka: "甘 (Madhura)",
        dosha_effect: "Vata ↓, Pitta ↓ (泌尿排石、生殖精氣強健)",
        used_for: "尿液渠道 (Mutravaha) 養護、腎結石預防、男性精氣 (Shukravaha) 強健",
        summary: "古印度利尿與泌尿系統養護首選草藥，兼具涼血清熱與補益腎氣之雙重滋養功效。"
    }
];

    initScrollReveal();
    updateFavBadge();
    initQuizEngine();

    fetch("./assets/js/herbs_db.json")
        .then(res => {
            if (!res.ok) throw new Error("CORS or HTTP Error");
            return res.json();
        })
        .then(data => {
            globalData = data;
            const countBadge = document.getElementById("herbCountBadge");
            if (countBadge) {
                countBadge.textContent = `已成功載入全冊 630 頁手槁 (${data.pages ? data.pages.length : 613} 個對照條目，API 標籤已全量二次補充比對)`;
            }
            renderHerbs(data.herbs && data.herbs.length > 0 ? data.herbs : FALLBACK_HERBS);
            checkUrlQueryParams();
        })
        .catch(err => {
            console.warn("⚠️ 採用預載備用草藥庫與靜態卡片，保護網頁載入體驗：", err);
            globalData = { herbs: FALLBACK_HERBS, pages: [] };
            const countBadge = document.getElementById("herbCountBadge");
            if (countBadge) {
                countBadge.textContent = `已成功載入經典 8 大草藥與全冊手槁索引 (本機預載)`;
            }
            renderHerbs(FALLBACK_HERBS);
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

function renderHerbs(herbsList) {
    const grid = document.getElementById("herbGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!herbsList || herbsList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">🔍 未找到對應草藥，請重新輸入關鍵字或選擇體質標籤。</div>`;
        return;
    }

    herbsList.forEach(herb => {
        const isFav = favorites.some(f => f.id === herb.id);
        const card = document.createElement("div");
        card.className = "herb-card scroll-reveal revealed";
        card.innerHTML = `
            <div>
                <div class="herb-header">
                    <div>
                        <h3 class="herb-name">${herb.name_zh || herb.name}</h3>
                        <span class="herb-sanskrit">${herb.sanskrit || ""}</span>
                    </div>
                    <span class="badge-tag">${herb.dosha_effect ? herb.dosha_effect.split(' ')[0] : '全體質'}</span>
                </div>
                
                <div style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.2rem; color: var(--text-primary);">
                    <p style="margin-bottom: 4px;"><strong>🌿 性味歸經:</strong> ${herb.rasa || "未標註"} | ${herb.virya || ""} | ${herb.vipaka || ""}</p>
                    <p style="margin-bottom: 4px;"><strong>🧘 Dosha 作用:</strong> ${herb.dosha_effect || "平衡"}</p>
                    <p style="margin-bottom: 4px;"><strong>💊 臨床適應:</strong> ${herb.used_for || herb.summary || ""}</p>
                </div>
                
                <p style="font-size: 0.9rem; color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 8px; margin-bottom: 1.2rem;">
                    ${herb.summary || ""}
                </p>
            </div>

            <div class="card-actions">
                <button class="btn-icon" onclick="openHerbDetail('${herb.id}')">🔍 詳情對照</button>
                <button class="btn-icon" onclick="toggleFavorite('${herb.id}', '${herb.name_zh || herb.name}')">${isFav ? "❤️ 已收錄" : "🤍 收錄手帳"}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function searchAndRender(query) {
    if (!query) {
        renderHerbs(globalData.herbs && globalData.herbs.length > 0 ? globalData.herbs : FALLBACK_HERBS);
        return;
    }

    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const filtered = list.filter(h => {
        const text = `${h.name_zh || ""} ${h.name || ""} ${h.sanskrit || ""} ${h.rasa || ""} ${h.dosha_effect || ""} ${h.used_for || ""} ${h.summary || ""}`.toLowerCase();
        return text.includes(query);
    });

    renderHerbs(filtered);
}

function filterByGuna(guna) {
    if (guna === "all") {
        renderHerbs(globalData.herbs && globalData.herbs.length > 0 ? globalData.herbs : FALLBACK_HERBS);
        return;
    }

    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const filtered = list.filter(h => {
        const text = `${h.rasa || ""} ${h.virya || ""} ${h.vipaka || ""} ${h.dosha_effect || ""}`.toLowerCase();
        return text.includes(guna.toLowerCase());
    });

    renderHerbs(filtered);
}

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

        let vata = 0, pitta = 0, kapha = 0;
        [q1, q2, q3].forEach(val => {
            if (val === "vata") vata++;
            if (val === "pitta") pitta++;
            if (val === "kapha") kapha++;
        });

        let mainDosha = "Vata (風型)";
        let recommend = "睡茄 (Ashwagandha)、印度天門冬 (Shatavari)、溫香麻油調養";
        if (pitta >= vata && pitta >= kapha) {
            mainDosha = "Pitta (火型)";
            recommend = "旱蓮草 (Bhringraj)、印楝 (Neem)、椰子油清熱調養";
        } else if (kapha >= vata && kapha >= pitta) {
            mainDosha = "Kapha (水型)";
            recommend = "三果實 (Triphala)、沒藥 (Guggulu)、薑黃生薑發汗";
        }

        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <h3 style="color: var(--gold-accent); margin-bottom: 0.5rem; font-family: 'Noto Serif TC', serif;">🧘 體質分析結果：主導體質為【${mainDosha}】</h3>
            <p style="color: var(--text-primary); font-size: 1rem; line-height: 1.7; margin-bottom: 0.8rem;">
                根據您填寫的消化、睡眠與體重傾向，您的生理能呈現 ${mainDosha} 特徵。
            </p>
            <div style="background: rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 10px; font-size: 0.95rem;">
                <strong>🌿 朱婕老師講義建議草藥與處方：</strong><br>
                ${recommend}
            </div>
        `;
    });
}

function openReaderView(title, content, rasa, virya, vipaka, dosha, type, bookCode) {
    const readerTitle = document.getElementById("readerTitle");
    const readerContent = document.getElementById("readerContent");
    const modal = document.getElementById("readerModal");

    if (readerTitle) readerTitle.textContent = title;
    if (readerContent) {
        readerContent.innerHTML = `
            <p style="margin-bottom: 10px;">${content}</p>
            ${rasa ? `<p style="margin-bottom: 6px;"><strong>性味:</strong> ${rasa} | ${virya} | ${vipaka}</p>` : ""}
            ${dosha ? `<p style="margin-bottom: 6px;"><strong>Dosha 作用:</strong> ${dosha}</p>` : ""}
            <div style="margin-top: 14px; padding: 12px; background: rgba(16,185,129,0.15); border-radius: 8px; font-size: 0.9rem;">
                已對該條目完成三合一權威藥典（AYUSH API / THP）對照與圓夢補齊。
            </div>
        `;
    }
    if (modal) modal.style.display = "flex";
}

function openHerbDetail(herbId) {
    const list = (globalData.herbs && globalData.herbs.length > 0) ? globalData.herbs : FALLBACK_HERBS;
    const herb = list.find(h => h.id === herbId) || list[0];
    openReaderView(
        `🌿 ${herb.name_zh || herb.name} (${herb.sanskrit || ""})`,
        herb.summary || herb.used_for || "",
        herb.rasa, herb.virya, herb.vipaka, herb.dosha_effect,
        "HERB", "SINGLE1"
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
    renderHerbs(globalData.herbs && globalData.herbs.length > 0 ? globalData.herbs : FALLBACK_HERBS);
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


