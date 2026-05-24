const cardContainer = document.getElementById('card-container');
const searchInput = document.getElementById('search-input');
const backBtn = document.getElementById('back-btn');
const identityGrid = document.getElementById('identity-serach-grid');

// 모달 관련 요소들 
const modal = document.getElementById('info-modal');
const closeModalBtn = document.getElementById('close-modal');

//url query parsing
const url_query = new URLSearchParams(location.search);

let identityData = null;

// 카드 렌더링 함수
function renderCards(dataList) {
    cardContainer.innerHTML = ''; 

    dataList.forEach(data => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        // 카드 클릭 시 모달 열기 이벤트
        cardDiv.addEventListener('click', () => {
            openModal(data.id);
        });


        cardDiv.innerHTML = `
            <img src="/identity/${data.img}" alt="${data.name}"">
            <div class="name">${data.name}</div>
        `;

        cardContainer.appendChild(cardDiv);
    });
}


// 모달 열기 함수
function openModal(id) {
    const data = identityData[id - 1]

    // 헤더 정보 채우기
    document.getElementById('modal-img').src = data.img;
    
    document.getElementById('modal-name').innerText = data.name;
    document.getElementById('modal-affil').innerText = `소속: ${data.affiliation}`;
    
    // 키워드 태그 생성
    const keywordContainer = document.getElementById('modal-keywords');
    keywordContainer.innerHTML = '';
    if(data.sim_keyword) {
        data.sim_keyword.forEach(kw => {
            keywordContainer.innerHTML += `<span class="sim-tag">${kw}</span>`;
        });
    }   
    if(data.keywords) {
        const g_keyword = data.keywords.filter(item => !data.sim_keyword.includes(item));
        g_keyword.forEach(kw => {
            keywordContainer.innerHTML += `<span class="tag">${kw}</span>`;
        });
    }

    // 스킬 세부 정보 HTML 생성
    const detailsContainer = document.getElementById('modal-details');
    let detailsHTML = '';

    // 데이터에 스킬 정보가 있을 경우에만 렌더링
    if (data.skill) {
        // 1. 액티브 스킬
        if (data.skill.skill && data.skill.skill.length > 0) {
            detailsHTML += `<div class="skill-section"><h3>액티브 스킬</h3>`;
            data.skill.skill.forEach((s, index) => {
                detailsHTML += `
                    <div class="skill-box">
                        <div class="skill-header">
                            <span>[스킬 ${index + 1}] ${s.name}</span>
                            <span class="skill-type">${s.type} / ${s.crime}</span>
                        </div>
                        <div class="skill-stats">
                            기본 위력: ${s.default_power} | 코인 위력: ${s.coin_power} (`
                        if (s.coin_type == "indestructible") {
                            detailsHTML += "파괴 불가 "
                        }
                detailsHTML += `코인: ${s.coin}개)
                        </div>
                    </div>`;
            });
            detailsHTML += `</div>`;
        }

        // 2. 수비 스킬
        if (data.skill.guard_skill) {
            const g = data.skill.guard_skill;
            detailsHTML += `
                <div class="skill-section">
                    <h3>수비 스킬</h3>
                    <div class="skill-box">
                        <div class="skill-header">
                            <span>${g.name}</span><span class="skill-type">${g.type} / ${g.crime}</span>
                        </div>
                        <div class="skill-stats">
                        기본 위력: ${g.default_power} | 코인 위력: ${g.coin_power} (`
                        if (g.coin_type == "indestructible") {
                            detailsHTML += "파괴 불가 "
                        }
                detailsHTML += `코인: ${g.coin}개)
                        </div>
                    </div>
                </div>`;
        }

        // 3. 패시브 스킬
        if (data.skill.passive_skill || data.skill.support_passive) {
            detailsHTML += `<div class="skill-section"><h3>패시브 & 서포트</h3>`;
            if(data.skill.passive_skill) {
                const p = data.skill.passive_skill;
                detailsHTML += `
                    <div class="skill-box">
                        <div class="skill-header"><span>[패시브] ${p.name}</span></div>
                        <div class="skill-type">
                        `
                for (let i = 0; i < p.resources.length; i++) {
                    detailsHTML += p.resources[i].name + "x" + p.resources[i].count + " "
                }
                detailsHTML +=" " + p.resource_type + `<br><br>` + p.des + `</div>
                </div>`;
            }
            
            if(data.skill.support_passive) {
                const sp = data.skill.support_passive;
                detailsHTML += `
                    <div class="skill-box">
                        <div class="skill-header"><span>[서포트] ${sp.name}</span></div>
                        <div class="skill-type">
                        `
                for (let i = 0; i < sp.resources.length; i++) {
                    detailsHTML += sp.resources[i].name + "x" + sp.resources[i].count + " "
                }
                detailsHTML +=" " + sp.resource_type + `<br><br>` + sp.des + `</div>
                </div>`;
            }
            detailsHTML += `</div>`;
        }
    } else {
        detailsHTML = `<p style="text-align:center; color:#aaa; margin-top:20px;">상세 정보가 없습니다.</p>`;
    }

    detailsContainer.innerHTML = detailsHTML;
    
    // 모달 표시
    modal.style.display = 'flex';
}


// 모달 닫기 이벤트
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 모달창 바깥(어두운 배경) 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

let selected_sinner = [];
let keyword = ""

function filterUpdate() {
    let filteredData;
    if (selected_sinner.length == 0) {
        filteredData = identityData.filter(data => 
            data.name.toLowerCase().includes(keyword) 
        );
    } else {
        filteredData = identityData.filter(data => 
            data.name.toLowerCase().includes(keyword) &&
            selected_sinner.includes(data.sinner)
        );
    }
    renderCards(filteredData);

}

// 검색 및 뒤로가기
searchInput.addEventListener('input', (event) => {
    keyword = event.target.value.toLowerCase();
    filterUpdate()
});

function identity_eng2kor(name) {
    switch (name) {
        case "yisang": return "이상"
        case "faust": return "파우스트"
        case "donquixote": return "돈키호테"
        case "gregor": return "그레고르"
        case "heathcliff": return "히스클리프"
        case "honglu": return "홍루"
        case "ishmael": return "이스마엘"
        case "meursault": return "뫼르소"
        case "outis": return "오티스"
        case "rodya": return "로쟈"
        case "ryoshu": return "료슈"
        case "sinclair": return "싱클레어"
        default: return ""
    }   
}

identityGrid.addEventListener('click', (event) => {
    let target;
    if(event.target.id != "identity-serach-grid") {
        if(event.target.nodeName == "IMG") {
            target = event.target.parentElement
        } else {
            target = event.target
        }
        if (target.className == "identity-serach-button-selected") {
            target.className = "identity-serach-button";
            const idx = selected_sinner.indexOf(identity_eng2kor(target.id))
            if (idx > -1) selected_sinner.splice(idx, 1)
        } else {
            target.className = "identity-serach-button-selected";
            selected_sinner.push(identity_eng2kor(target.id))
        }
        filterUpdate()
    }
});

backBtn.addEventListener('click', () => { window.history.back(); });

function card_url_query() {
    if (url_query.get("id")) {
    let identity_id = Number(url_query.get("id"))

    if (isNaN(identity_id)) {
        console.log("id parsing error")
        return
    }

    if (identity_id <= 0  || identityData.length < identity_id) {
        console.log("id invaild")
        return
    }
    
    openModal(identity_id)
}
}

async function loadIdentityData() {
    try {
        // data.json 파일을 불러옵니다 (파일 경로는 실제 파일 위치에 맞게 수정 가능)
        const response = await fetch('./data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        identityData = await response.json(); // 데이터를 배열로 변환하여 저장
        renderCards(identityData); // 카드 렌더링 실행
        
        card_url_query()

    } catch (error) {
        console.error("데이터 로드 실패:", error);
    }
}

// 초기 화면 그리기
loadIdentityData()

