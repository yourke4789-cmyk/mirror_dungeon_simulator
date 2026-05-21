import { IdentityManager } from './IdentityManager.js';
import { Deck } from './models.js';
import { AppView } from './view.js';

const manager = new IdentityManager();
const deck = new Deck();
const view = new AppView();

let currentSinner = null;
let currentSearch = "";

async function init() {
    await manager.load();
    update();

    // 통합 이벤트 리스너
    document.addEventListener('click', e => {
        if (e.target.dataset.sinner) {
            currentSinner = currentSinner === e.target.dataset.sinner ? null : e.target.dataset.sinner;
            update();
        }
        const card = e.target.closest('.card');
        if (card) {
            const id = manager.all.find(i => i.id == card.dataset.id);
            deck.updateDeck(id, manager.all);
            update();
        }
    });

    document.getElementById('search-input').addEventListener('input', e => {
        currentSearch = e.target.value;
        update();
    });
}

function update() {
    const filtered = manager.filter(currentSinner, currentSearch);
    view.render(filtered, deck, currentSinner, manager.sinners);
}

init();