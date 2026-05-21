export class IdentityManager {
    constructor() {
        this.all = [];
        this.sinners = ["이상", "파우스트", "돈키호테", "료슈", "뫼르소", "홍루", "히스클리프", "이스마엘", "로쟈", "싱클레어", "오티스", "그레고르"];
    }

    async load() {
        const res = await fetch('./data.json');
        const data = await res.json();
        this.all = data.map(d => d);
    }

    filter(sinnerFilter, searchText) {
        return this.all.filter(id => {
            const matchSinner = sinnerFilter ? id.sinner === sinnerFilter : true;
            const matchSearch = id.name.includes(searchText);
            return matchSinner && matchSearch;
        });
    }
}