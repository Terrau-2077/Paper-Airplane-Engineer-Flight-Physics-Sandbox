// 任务评判
// 计算飞行成绩：距离赛 / 滞空赛

export class Mission {
    constructor(type = 'distance') {
        this.type = type; // 'distance' | 'duration'
        this.bestDistance = 0;
        this.bestDuration = 0;
    }

    evaluate(flightState) {
        const result = {
            distance: flightState.totalDistance,
            duration: flightState.duration,
            score: 0,
            isNewBest: false,
        };

        if (this.type === 'distance') {
            result.score = result.distance;
            if (result.distance > this.bestDistance) {
                this.bestDistance = result.distance;
                result.isNewBest = true;
            }
        } else if (this.type === 'duration') {
            result.score = result.duration;
            if (result.duration > this.bestDuration) {
                this.bestDuration = result.duration;
                result.isNewBest = true;
            }
        }

        return result;
    }

    setMissionType(type) {
        this.type = type;
    }

    getBestScore() {
        return this.type === 'distance' ? this.bestDistance : this.bestDuration;
    }
}
