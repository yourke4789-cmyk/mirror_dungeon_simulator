// ==========================================
// 파일명: Event_Ego_main.js (모달, 필터 및 이미지 비율 보존 완수)
// ==========================================

import { IdentityManager } from '../simulator/IdentityManager.js';

const manager = new IdentityManager();

// 전역 상태 변수 (다중 조건 AND 필터용)
let egoData = [];
let currentEgoSinner = null;
let currentGrade = null;
let currentKeyword = "";

/**
 * 애플리케이션 초기화 컨트롤러
 */
async function init() {
    try {
        // 1. 공통 인격 데이터 로드
        const res = await fetch('../simulator/data.json');
        manager.all = await res.json(); 

        // 2. 신규 EGO 데이터 로드
        const egoRes = await fetch('./idealego_data.json');
        egoData = await egoRes.json();

        setupTabs();
        renderSinnerIcons();
        setupFilters();
        
        // 3. 모달 닫기 이벤트 (메모리 최적화를 위해 1회만 등록)
        document.getElementById('modal-close')?.addEventListener('click', () => {
            document.getElementById('ego-modal').classList.remove('active');
        });
        
    } catch (error) {
        console.error("데이터 로드 실패:", error);
    }
}

/**
 * 상위 메뉴 탭 레이아웃 전환 제어
 */
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

/**
 * 수감자 아이콘 렌더링 및 필터 상태 바인딩
 */
function renderSinnerIcons() {
    const grid = document.getElementById('sinner-icons');
    if (!grid) return;

    grid.innerHTML = manager.sinners.map(sinner => 
        `<button class="sinner-icon" data-sinner="${sinner}">${sinner}</button>`
    ).join('');

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('sinner-icon')) {
            // 토글 로직: 이미 선택된 수감자를 다시 누르면 선택 해제(null)
            if (currentEgoSinner === e.target.dataset.sinner) {
                currentEgoSinner = null;
                e.target.classList.remove('active');
            } else {
                document.querySelectorAll('.sinner-icon').forEach(icon => icon.classList.remove('active'));
                e.target.classList.add('active');
                currentEgoSinner = e.target.dataset.sinner;
            }
            
            // 필터링된 EGO 화면 갱신 트리거
            renderFilteredEgos();
        }
    });
}

/**
 * 등급 및 키워드 다중 상태 제어 로직
 */
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
            // 필터링된 EGO 화면 갱신 트리거
            renderFilteredEgos();
        });
    });

    const keywordSelect = document.getElementById('keyword-select');
    if (keywordSelect) {
        keywordSelect.addEventListener('change', (e) => {
            currentKeyword = e.target.value;
            // 필터링된 EGO 화면 갱신 트리거
            renderFilteredEgos();
        });
    }
}

/**
 * [핵심 로직] 다중 조건(AND) 필터링 및 EGO 카드 동적 렌더링
 */
function renderFilteredEgos() {
    const listDiv = document.getElementById('ego-list');
    if (!listDiv) return;

    // 수감자, 등급, 키워드 3가지 조건의 교집합 검증
    const filtered = egoData.filter(ego => {
        const matchSinner = currentEgoSinner ? ego.sinner === currentEgoSinner : true;
        const matchGrade = currentGrade ? ego.grade === currentGrade : true;
        const matchKeyword = currentKeyword ? ego.keywords.includes(currentKeyword) : true;
        return matchSinner && matchGrade && matchKeyword;
    });

    // 검색 결과가 없을 경우의 예외 처리
    if (filtered.length === 0) {
        listDiv.innerHTML = `<p style="padding: 20px; color: #aaa;">조건에 맞는 EGO가 없습니다.</p>`;
        return;
    }

    // 필터링된 데이터를 바탕으로 카드 UI 생성 (object-fit: contain 적용 완료)
    listDiv.innerHTML = `<div class="sinner-grid">` + filtered.map(ego => `
        <div class="sinner-icon ego-card" data-egoid="${ego.id}" style="width: 140px; height: 180px; padding: 5px; display: flex; flex-direction: column; align-items: center; border: 1px solid #555; background: #2a2421; border-radius: 8px; cursor: pointer;">
            <img src="${ego.img}" style="width: 100%; height: 110px; object-fit: contain; border-radius: 4px; margin-bottom: 8px;" onerror="this.src='https://via.placeholder.com/140x110?text=No+Image'">
            <div style="font-size: 11px; color: #d4af37; margin-bottom: 2px;">[${ego.grade}]</div>
            <div style="font-size: 13px; font-weight: bold; text-align: center; line-height: 1.2;">${ego.name}</div>
        </div>
    `).join('') + `</div>`;

    // 생성된 카드에 모달 팝업 이벤트 바인딩
    document.querySelectorAll('.ego-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const egoId = parseInt(e.currentTarget.dataset.egoid);
            openModal(egoId);
        });
    });
}

/**
 * [핵심 로직] 선택된 EGO 데이터 모달 삽입 및 노출
 */
function openModal(egoId) {
    const ego = egoData.find(e => e.id === egoId);
    if(!ego) return;

    // DOM 요소에 데이터 매핑
    document.getElementById('modal-img').src = ego.img;
    document.getElementById('modal-title').innerText = `${ego.sinner} - ${ego.name}`;
    document.getElementById('modal-grade').innerText = ego.grade;
    document.getElementById('modal-keywords').innerText = ego.keywords.join(', ');
    document.getElementById('modal-desc').innerText = ego.desc;

    // 모달 CSS 상태 변경을 통한 노출
    document.getElementById('ego-modal').classList.add('active');
}

// 초기 실행 루프 시작
init();