// 结果面板
// 飞行结束后显示成绩

export class ResultOverlay {
    constructor() {
        this.element = document.getElementById('result-overlay');
        this.distanceEl = document.getElementById('result-distance');
        this.timeEl = document.getElementById('result-time');
    }

    show(distance, time) {
        this.distanceEl.textContent = distance.toFixed(1);
        this.timeEl.textContent = time.toFixed(1);
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }
}
