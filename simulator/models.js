export class Identity {
    constructor(data) {
        Object.assign(this, data);
    }
}

export class Deck {
    constructor() {
        this.mainUnits = []; // 1군: 수동 (최대 6)
        this.subUnits = [];  // 2군: 자동 (최대 6)
    }

    // 1군 추가 및 2군 자동 갱신
    updateDeck(identity, allData) {
        const isExists = this.mainUnits.find(u => u.id === identity.id);
        if (isExists) {
            this.mainUnits = this.mainUnits.filter(u => u.id !== identity.id);
        } else if (this.mainUnits.length < 6) {
            // 동일 수감자 중복 편성 방지
            if (this.mainUnits.some(u => u.sinner === identity.sinner)) return;
            this.mainUnits.push(identity);
        }
        this.generateAutoSub(allData);
    }

    generateAutoSub(allData) {
        const mainSinnerNames = this.mainUnits.map(u => u.sinner);
        const mainKeywords = this.mainUnits.flatMap(u => u.keywords);

        // 1군 수감자 제외 + 키워드 매칭 순 정렬
        this.subUnits = allData
            .filter(id => !mainSinnerNames.includes(id.sinner))
            .sort((a, b) => {
                const aMatch = a.keywords.filter(k => mainKeywords.includes(k)).length;
                const bMatch = b.keywords.filter(k => mainKeywords.includes(k)).length;
                return bMatch - aMatch;
            })
            .slice(0, 6);
    }
}