import { IdentityManager } from '../simulator/IdentityManager.js';

const manager = new IdentityManager();

// --- 전역 상태 변수 ---
let egoData = [], eventData = [], themeData = [];
let currentEgoSinner = null, currentGrade = null, currentKeyword = "";
let currentEventSearch = "";
let currentDifficulty = "NORMAL", currentThemeId = null;


// ==========================================
// [공통 및 EGO 함수]
// ==========================================
function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });
}

function renderSinnerIcons() {
    const grid = document.getElementById('sinner-icons');
    if (!grid) return;
    grid.innerHTML = (manager.sinners || []).map(sinner => 
        `<button class="sinner-icon" data-sinner="${sinner}">${sinner}</button>`
    ).join('');

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('sinner-icon')) {
            if (currentEgoSinner === e.target.dataset.sinner) {
                currentEgoSinner = null;
                e.target.classList.remove('active');
            } else {
                document.querySelectorAll('.sinner-icon').forEach(icon => icon.classList.remove('active'));
                e.target.classList.add('active');
                currentEgoSinner = e.target.dataset.sinner;
            }
            renderFilteredEgos();
        }
    });
}

function setupFilters() {
    const gradeBtns = document.querySelectorAll('.grade-btn');
    gradeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (currentGrade === e.target.dataset.grade) {
                currentGrade = null;
                e.target.classList.remove('active');
            } else {
                gradeBtns.forEach(b => b.classList.remove('active')); 
                e.target.classList.add('active'); 
                currentGrade = e.target.dataset.grade;
            }
            renderFilteredEgos();
        });
    });
    const keywordSelect = document.getElementById('keyword-select');
    if (keywordSelect) {
        keywordSelect.addEventListener('change', (e) => {
            currentKeyword = e.target.value;
            renderFilteredEgos();
        });
    }
}

function renderFilteredEgos() {
    const listDiv = document.getElementById('ego-list');
    if (!listDiv) return;

    const filtered = egoData.filter(ego => {
        const matchSinner = currentEgoSinner ? ego.sinner === currentEgoSinner : true;
        const matchGrade = currentGrade ? ego.grade === currentGrade : true;
        const matchKeyword = currentKeyword ? ego.keywords.includes(currentKeyword) : true;
        return matchSinner && matchGrade && matchKeyword;
    });

    if (filtered.length === 0) {
        listDiv.innerHTML = `<p style="padding: 20px; color: #aaa;">조건에 맞는 EGO가 없습니다.</p>`;
        return;
    }

    listDiv.innerHTML = `<div class="sinner-grid">` + filtered.map(ego => `
        <div class="sinner-icon ego-card" data-egoid="${ego.id}" style="width: 140px; height: 180px; padding: 5px; display: flex; flex-direction: column; align-items: center; border: 1px solid #555; background: #2a2421; border-radius: 8px; cursor: pointer;">
            <img src="${ego.img}" style="width: 100%; height: 110px; object-fit: contain; border-radius: 4px; margin-bottom: 8px;" onerror="this.src='https://via.placeholder.com/140x110?text=No+Image'">
            <div style="font-size: 11px; color: #d4af37; margin-bottom: 2px;">[${ego.grade}]</div>
            <div style="font-size: 13px; font-weight: bold; text-align: center; line-height: 1.2;">${ego.name}</div>
        </div>
    `).join('') + `</div>`;

    document.querySelectorAll('.ego-card').forEach(card => {
        card.addEventListener('click', (e) => openModal(parseInt(e.currentTarget.dataset.egoid)));
    });
}

function openModal(egoId) {
    const ego = egoData.find(e => e.id === egoId);
    if(!ego) return;
    document.getElementById('modal-img').src = ego.img;
    document.getElementById('modal-title').innerText = `${ego.sinner} - ${ego.name}`;
    document.getElementById('modal-grade').innerText = ego.grade;
    document.getElementById('modal-keywords').innerText = ego.keywords.join(', ');
    
    const crimeText = Object.entries(ego.crime).map(([key, value]) => `${key}x${value}`).join(', ');
    const passiveName = ego.passive.name ? `(${ego.passive.name})` : '';
    document.getElementById('modal-desc').innerText = `소모 자원: ${crimeText}\n정신력 소모: ${ego.sanity}\n패시브${passiveName} : \n${ego.passive.description}`;
    document.getElementById('ego-modal').classList.add('active');
}

// ==========================================
// [이벤트 관련 함수]
// ==========================================
function renderGifts(gifts) {
    const giftDisplay = document.getElementById('event-gift-display');
    if (!giftDisplay) return;
    giftDisplay.innerHTML = gifts?.length ? gifts.map(g => `
        <div class="gift-item">
            <img src="${g.img}" onerror="this.src='https://via.placeholder.com/60x60?text=Gift'">
            <span class="gift-name">${g.name}</span>
        </div>
    `).join('') : '<p style="color:#aaa; font-size:12px; padding:10px;">획득 기프트 없음</p>';
}

function setupEventSearch() {
    const searchInput = document.getElementById('event-search'); // 수정된 ID
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentEventSearch = e.target.value.toLowerCase();
            renderEventList(); 
        });
    }
}

function renderEventList() {
    const listDiv = document.getElementById('event-list');
    if (!listDiv) return;

    const filteredEvents = eventData.filter(ev => ev.title.toLowerCase().includes(currentEventSearch));

    listDiv.innerHTML = filteredEvents.map(ev => 
        `<li class="event-list-item" data-id="${ev.eventId}">${ev.title}</li>`
    ).join('');
    
    document.querySelectorAll('.event-list-item').forEach(li => {
        li.addEventListener('click', (e) => {
            document.querySelectorAll('.event-list-item').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            
            const ev = eventData.find(d => d.eventId === e.target.dataset.id);
            if (ev) {
                document.getElementById('event-title-display').innerText = ev.title + " - 기프트";
                renderGifts(ev.obtainableGifts);
                renderEventNode(ev);
            }
        });
    });
}

function renderEventNode(node) {
    const descArea = document.getElementById('event-desc-content');
    let html = `<p style="white-space: pre-wrap;">${node.description || node.resultText || ''}</p>`;
    
    if (node.reward) {
        html += `<p class="reward-text" style="color: #e5b044; margin-top: 15px; padding: 10px; background: rgba(229,176,68,0.1); border-left: 3px solid #e5b044; white-space: pre-wrap;">[보상/결과] ${node.reward}</p>`;
    }

    if (node.choices && node.choices.length > 0) {
        html += `<div class="choice-buttons">`;
        node.choices.forEach((c, i) => {
            let detailHtml = '';
            if (c.resultGift) {
                detailHtml = `
                    <div style="display:flex; align-items:center; gap:8px; margin-top:6px; padding:6px; background:rgba(0,0,0,0.3); border-radius:4px;">
                        <img src="${c.resultGift.img}" style="width:24px; height:24px; object-fit:contain;" onerror="this.style.display='none'">
                        <span style="font-size:12px; color:#d4af37; font-weight:bold;">획득: ${c.resultGift.name}</span>
                    </div>`;
            } else if (c.hint) {
                detailHtml = `<span style="font-size:11px; color:#aaa; display:block; margin-top:4px; font-style:italic;">→ ${c.hint}</span>`;
            }
            html += `<button class="choice-btn" data-idx="${i}">${c.text}${detailHtml}</button>`;
        });
        html += `</div>`;
    }
    descArea.innerHTML = html;

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const c = node.choices[e.currentTarget.dataset.idx];
            if (c.resultGift) renderGifts([c.resultGift]);
            c.next ? renderEventNode(c.next) : renderEventNode({ resultText: c.resultText, reward: c.reward });
        });
    });
}

// ==========================================
// [신규: 테마팩 관련 함수]
// ==========================================
function setupThemeTabs() {
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentDifficulty = e.target.dataset.diff;
            currentThemeId = null; 
            updateThemeDetail(null);
            renderThemeList();
        });
    });
}

function renderThemeList() {
    const listDiv = document.getElementById('theme-pack-list');
    if (!listDiv) return;

    const filteredThemes = themeData.filter(theme => theme.difficulty.includes(currentDifficulty));

    if (filteredThemes.length === 0) {
        listDiv.innerHTML = `<p style="color:#aaa; grid-column: 1/-1;">해당 난이도에 설정된 테마팩이 없습니다.</p>`;
        return;
    }

    listDiv.innerHTML = filteredThemes.map(theme => `
        <div class="theme-card ${currentThemeId === theme.id ? 'active' : ''}" data-id="${theme.id}">
            <img src="${theme.img}" alt="${theme.name}">
            <span class="theme-name">${theme.name}</span>
        </div>
    `).join('');

    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            currentThemeId = e.currentTarget.dataset.id;
            const selectedTheme = themeData.find(t => t.id === currentThemeId);
            updateThemeDetail(selectedTheme);
        });
    });
}

function updateThemeDetail(theme) {
    const floorDiv = document.getElementById('theme-floor-display');
    const giftDiv = document.getElementById('theme-gift-display');

    if (!theme) {
        floorDiv.innerText = "-";
        giftDiv.innerHTML = `<span style="color:#666; font-size:12px;">선택된 테마가 없습니다.</span>`;
        return;
    }

    floorDiv.innerText = theme.floor || "-";
    
    if (theme.gifts && theme.gifts.length > 0) {
        // [수정점 3번] onerror 끝부분 따옴표(?)' 추가됨
        // [수정점 1번] data-name 속성 및 마우스 커서 스타일 추가됨
        giftDiv.innerHTML = theme.gifts.map(gift => `
            <div class="theme-gift-item" data-name="${gift.name}" style="cursor: pointer;" title="${gift.name}">
                <img src="${gift.img}" alt="${gift.name}" onerror="this.src='https://via.placeholder.com/40/000/e5b044?text=?'">
            </div>
        `).join('');

        // [수정점 1번] 유실되었던 클릭 이벤트 리스너 다시 복구
        document.querySelectorAll('.theme-gift-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetGiftName = e.currentTarget.dataset.name;
                // 이전 대화에서 만들었던 openGiftModal 함수가 존재한다면 호출
                if (typeof openGiftModal === "function") {
                    openGiftModal(targetGiftName);
                } else {
                    console.warn("openGiftModal 함수가 아직 복구되지 않았습니다.");
                }
            });
        });
    } else {
        giftDiv.innerHTML = `<span style="color:#aaa; font-size:12px;">고유 기프트 없음</span>`;
    }
}

// ==========================================
// [초기화 실행]
// ==========================================
async function init() {
    try {
        const [res, egoRes, eventRes, themeRes] = await Promise.all([
            fetch('../simulator/data.json').catch(() => ({ json: () => [] })),
            fetch('./ego_data.json').catch(() => ({ json: () => [] })),
            fetch('./Event_Option.json').catch(() => ({ json: () => [] })),
            fetch('./Theme_Pack.json').catch(() => ({ json: () => [] })) // <- 새로 추가된 줄
        ]);
        manager.all = await res.json();
        egoData = await egoRes.json();
        eventData = await eventRes.json();
        themeData = await themeRes.json(); // 추후 fetch('./Theme_Pack.json') 으로 교체 가능

        setupTabs();
        renderSinnerIcons();
        setupFilters();
        setupEventSearch();
        renderFilteredEgos();
        renderEventList();

        setupThemeTabs();
        renderThemeList();
        updateThemeDetail(null);

        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('ego-modal').classList.remove('active');
        });
    } catch (e) { console.error("로드 오류:", e); }
}

init();