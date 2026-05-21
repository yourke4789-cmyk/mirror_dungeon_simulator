export class AppView {
    constructor() {
        this.filters = document.getElementById('sinner-filters');
        this.picker = document.getElementById('picker-grid');
        this.mainList = document.getElementById('main-deck-list');
        this.subList = document.getElementById('sub-deck-list');
    }

    render(identities, deck, activeSinner, sinners) {
        // 필터(로고) 렌더링
        this.filters.innerHTML = sinners.map(s => `
            <button class="sinner-btn ${activeSinner === s ? 'active' : ''}" data-sinner="${s}">${s}</button>
        `).join('');

        // 인격 픽커 렌더링 (이미지 포함)
        this.picker.innerHTML = identities.map(id => {
            const inMain = deck.mainUnits.some(m => m.id === id.id);
            return `
                <div class="card ${inMain ? 'selected' : ''}" data-id="${id.id}">
                    <img src="${id.img}" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="name">${id.name}</div>
                </div>`;
        }).join('');

        // 1군/2군 리스트 렌더링
        this.mainList.innerHTML = deck.mainUnits.map(u => `<div class="item">${u.sinner} | ${u.name}</div>`).join('');
        this.subList.innerHTML = deck.subUnits.map(u => `<div class="item sub">${u.sinner} | ${u.name}</div>`).join('');
    }
}