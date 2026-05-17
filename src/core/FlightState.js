// 飞行状态机
// 管理飞机状态：idle(待发射) → flying(飞行中) → landed(已落地)

export const FlightStates = {
    IDLE: 'idle',
    FLYING: 'flying',
    LANDED: 'landed',
};

export class FlightState {
    constructor() {
        this.state = FlightStates.IDLE;
        this.startTime = 0;
        this.endTime = 0;
        this.duration = 0;
        this.maxAltitude = 0;
        this.totalDistance = 0;
        this.startPosition = null;
    }

    launch(position) {
        this.state = FlightStates.FLYING;
        this.startTime = performance.now() / 1000;
        this.startPosition = position.clone();
        this.maxAltitude = position.y;
        this.totalDistance = 0;
        console.log('[FlightState] 发射，位置:', position);
    }

    land() {
        if (this.state === FlightStates.FLYING) {
            this.state = FlightStates.LANDED;
            this.endTime = performance.now() / 1000;
            this.duration = this.endTime - this.startTime;
            console.log('[FlightState] 落地，飞行时间:', this.duration.toFixed(2), 's');
        }
    }

    reset() {
        this.state = FlightStates.IDLE;
        this.startTime = 0;
        this.endTime = 0;
        this.duration = 0;
        this.maxAltitude = 0;
        this.totalDistance = 0;
        this.startPosition = null;
        console.log('[FlightState] 重置');
    }

    isIdle() {
        return this.state === FlightStates.IDLE;
    }

    isFlying() {
        return this.state === FlightStates.FLYING;
    }

    isLanded() {
        return this.state === FlightStates.LANDED;
    }

    update(position) {
        if (this.state === FlightStates.FLYING) {
            const currentTime = performance.now() / 1000;
            this.duration = currentTime - this.startTime;
            this.maxAltitude = Math.max(this.maxAltitude, position.y);
            if (this.startPosition) {
                const dx = position.x - this.startPosition.x;
                const dz = position.z - this.startPosition.z;
                this.totalDistance = Math.sqrt(dx * dx + dz * dz);
            }
        }
    }
}
