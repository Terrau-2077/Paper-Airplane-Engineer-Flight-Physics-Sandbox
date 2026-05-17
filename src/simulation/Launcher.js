// 发射逻辑
// 根据初速度和角度创建初始速度矢量

import * as THREE from 'three';

export class Launcher {
    constructor() {
        this.launchHeight = 1.5; // 发射高度 m
    }

    // 计算发射速度矢量
    // speed: 初速度大小 m/s
    // angle: 发射仰角 deg（相对于水平面）
    // heading: 航向角 deg（相对于 x 轴，默认 0 即沿 x 轴向前）
    computeLaunchVelocity(speed, angle, heading = 0) {
        const angleRad = angle * (Math.PI / 180);
        const headingRad = heading * (Math.PI / 180);

        const vx = speed * Math.cos(angleRad) * Math.cos(headingRad);
        const vy = speed * Math.sin(angleRad);
        const vz = speed * Math.cos(angleRad) * Math.sin(headingRad);

        return new THREE.Vector3(vx, vy, vz);
    }

    getLaunchPosition() {
        return new THREE.Vector3(0, this.launchHeight, 0);
    }

    setLaunchHeight(height) {
        this.launchHeight = height;
    }
}
