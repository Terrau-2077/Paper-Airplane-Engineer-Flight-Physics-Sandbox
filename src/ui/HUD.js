// 飞行数据 HUD
// 实时显示飞行参数

export class HUD {
    constructor() {
        this.element = document.getElementById('hud');
        this.elements = {
            speed: document.getElementById('hud-speed'),
            altitude: document.getElementById('hud-altitude'),
            distance: document.getElementById('hud-distance'),
            aoa: document.getElementById('hud-aoa'),
            ld: document.getElementById('hud-ld'),
            time: document.getElementById('hud-time'),
        };
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    update(data) {
        this.elements.speed.textContent = data.speed.toFixed(1) + ' m/s';
        this.elements.altitude.textContent = data.altitude.toFixed(1) + ' m';
        this.elements.distance.textContent = data.distance.toFixed(1) + ' m';
        this.elements.aoa.textContent = data.aoa.toFixed(1) + '°';
        this.elements.ld.textContent = data.ld.toFixed(2);
        this.elements.time.textContent = data.time.toFixed(1) + ' s';
    }
}
