const categories = [
  { name: "화상", file: "burn.json" },
  { name: "출혈", file: "bleed.json" },
  { name: "진동", file: "tremor.json" },
  { name: "파열", file: "rupture.json" },
  { name: "침잠", file: "sinking.json" },
  { name: "호흡", file: "poise.json" },
  { name: "충전", file: "charge.json" },
  { name: "참격", file: "slash.json" },
  { name: "관통", file: "pierce.json" },
  { name: "타격", file: "blunt.json" },
  { name: "범용", file: "common.json" }
];

let currentCategory = categories[0];
let currentMode = "normal";
let gifts = [];

const categoryTabs = document.getElementById("categoryTabs");
const giftArea = document.getElementById("giftArea");
const sectionTitle = document.getElementById("sectionTitle");

const normalBtn = document.getElementById("normalBtn");
const plusBtn = document.getElementById("plusBtn");
const doublePlusBtn = document.getElementById("doublePlusBtn");

function textLines(lines) {
  if (Array.isArray(lines)) return lines.join("\n");
  return lines || "";
}

function getGiftDesc(gift) {
  if (currentMode === "doublePlus" && gift.doublePlusDesc) {
    return textLines(gift.doublePlusDesc);
  }

  if (currentMode === "plus" && gift.plusDesc) {
    return textLines(gift.plusDesc);
  }

  return textLines(gift.normalDesc);
}

function renderCategoryButtons() {
  categoryTabs.innerHTML = categories.map(category => `
    <button 
      class="category-btn ${category.name === currentCategory.name ? "active" : ""}"
      data-name="${category.name}"
    >
      ${category.name}
    </button>
  `).join("");

  document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const selectedName = button.dataset.name;
      currentCategory = categories.find(category => category.name === selectedName);

      renderCategoryButtons();
      await loadGiftsByCategory();
    });
  });
}

async function loadGiftsByCategory() {
  sectionTitle.textContent = currentCategory.name;
  giftArea.innerHTML = `<div class="empty-message">데이터를 불러오는 중입니다...</div>`;

  try {
    const response = await fetch(`./data/${currentCategory.file}`);

    if (!response.ok) {
      throw new Error(`${currentCategory.file} 파일을 불러오지 못했습니다.`);
    }

    gifts = await response.json();
    renderGifts();

  } catch (error) {
    console.error(error);

    gifts = [];
    giftArea.innerHTML = `
      <div class="empty-message">
        ${currentCategory.name} 데이터를 불러오지 못했습니다.<br>
        ./data/${currentCategory.file} 파일이 있는지 확인하세요.
      </div>
    `;
  }
}

function renderGifts() {
  if (gifts.length === 0) {
    giftArea.innerHTML = `
      <div class="empty-message">
        아직 등록된 ${currentCategory.name} E.G.O 기프트가 없습니다.
      </div>
    `;
    return;
  }

  const tiers = [...new Set(gifts.map(gift => gift.tier))];

  giftArea.innerHTML = tiers.map(tier => {
    const tierGifts = gifts.filter(gift => gift.tier === tier);

    return `
      <div class="inner-group">
        <div class="group-title">${tier}</div>

        <div class="box-row">
          ${tierGifts.map(gift => {
            const hasPlus = Boolean(gift.plusDesc);
            const hasDoublePlus = Boolean(gift.doublePlusDesc);
            const desc = getGiftDesc(gift);

            return `
              <div class="damage-box
                ${hasPlus || hasDoublePlus ? "upgradeable" : ""}
                ${currentMode === "plus" && hasPlus ? "plus-mode" : ""}
                ${currentMode === "doublePlus" && hasDoublePlus ? "double-plus-mode" : ""}
              ">
                <img src="${gift.img}" alt="${gift.name}">

                <div class="tooltip">
                  <span class="tooltip-title">${gift.name}</span>
                  <span class="tooltip-desc">${desc}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function setupModeButtons() {
  normalBtn.addEventListener("click", () => setMode("normal"));
  plusBtn.addEventListener("click", () => setMode("plus"));
  doublePlusBtn.addEventListener("click", () => setMode("doublePlus"));
}

function setMode(mode) {
  currentMode = mode;

  normalBtn.classList.toggle("active", currentMode === "normal");
  plusBtn.classList.toggle("active", currentMode === "plus");
  doublePlusBtn.classList.toggle("active", currentMode === "doublePlus");

  renderGifts();
}

async function init() {
  renderCategoryButtons();
  setupModeButtons();
  await loadGiftsByCategory();
}

init();