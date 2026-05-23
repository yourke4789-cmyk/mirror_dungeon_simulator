import { IdentityManager } from '../simulator/IdentityManager.js';

const manager = new IdentityManager();

// --- 전역 상태 변수 ---
let egoData = [], eventData = [];
let currentEgoSinner = null, currentGrade = null, currentKeyword = "";

// 1. [최상단 정의] 다른 함수들보다 먼저 정의하여 스코프 문제 방지
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

// 2. [함수 선언부] 호이스팅 방지를 위해 상단 배치
function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
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
    const formattedDesc = `소모 자원: ${crimeText}\n정신력 소모: ${ego.sanity}\n패시브${passiveName} : \n${ego.passive.description}`;
    
    document.getElementById('modal-desc').innerText = formattedDesc;
    document.getElementById('ego-modal').classList.add('active');
}

function renderEventList() {
    const listDiv = document.getElementById('event-list');
    if (!listDiv) return;
    listDiv.innerHTML = eventData.map(ev => `<li class="event-list-item" data-id="${ev.eventId}">${ev.title}</li>`).join('');
    
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

// 3. [초기화 실행]
async function init() {
    try {
        const [res, egoRes, eventRes] = await Promise.all([
            fetch('../simulator/data.json').catch(() => ({ json: () => [] })),
            fetch('./ego_data.json').catch(() => ({ json: () => [] })),
            fetch('./Event_Option.json').catch(() => ({ json: () => [] }))
        ]);
        manager.all = await res.json();
        egoData = await egoRes.json();
        eventData = await eventRes.json();

        setupTabs();
        renderSinnerIcons();
        setupFilters();
        renderFilteredEgos();
        renderEventList();

        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('ego-modal').classList.remove('active');
        });
    } catch (e) { console.error("로드 오류:", e); }
}

init();