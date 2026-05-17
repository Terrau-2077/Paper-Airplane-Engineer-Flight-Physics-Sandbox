// 空气动力学计算模块
// 基于薄翼理论，计算升力、阻力、俯仰力矩

import * as THREE from 'three';

const RHO = 1.225; // 空气密度 kg/m³
const G = 9.81; // 重力加速度 m/s²
const STALL_ANGLE = 15; // 失速攻角 deg
const CD0 = 0.01; // 零升阻力系数（纸飞机阻力较小）
const K = 0.03; // 诱导阻力因子

export class Aerodynamics {
    constructor() {
        this.rho = RHO;
        this.g = G;
        this.stallAngle = STALL_ANGLE * (Math.PI / 180);
    }

    // 计算升力系数 CL(α)
    // 薄翼理论：CL ≈ 2π × α (小角度)，这里使用 sin 使其在非线性段也有合理值
    // 纸飞机的升力效率低于理想薄翼，乘以效率因子 0.6
    computeCL(angleOfAttack) {
        const alpha = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angleOfAttack));
        const absAlpha = Math.abs(alpha);
        const efficiency = 0.8; // 纸飞机升力效率因子（适当提高以获得更好的滑翔性能）

        if (absAlpha > this.stallAngle) {
            // 失速：CL 骤降，保持一定值避免完全失去升力
            const stallFactor = 1 - (absAlpha - this.stallAngle) / (Math.PI / 2 - this.stallAngle);
            const stalledCL = 2 * Math.PI * Math.sin(this.stallAngle) * efficiency * Math.max(0.3, stallFactor);
            return alpha > 0 ? stalledCL : -stalledCL;
        }

        // 线性段
        return 2 * Math.PI * Math.sin(alpha) * efficiency;
    }

    // 计算阻力系数 CD(α) = CD0 + K × CL²
    computeCD(angleOfAttack) {
        const cl = this.computeCL(angleOfAttack);
        return CD0 + K * cl * cl;
    }

    // 计算俯仰力矩系数 CM(α)
    // 简化模型：CM 与攻角成正比，与重心位置相关
    computeCM(angleOfAttack, cgPosition) {
        // cgPosition: 0.15 ~ 0.45 (从前缘起占弦长比例)
        // 中性点在 0.25 附近，重心越靠前，静稳定性越强（恢复力矩越大）
        const neutralPoint = 0.25;
        const stabilityMargin = cgPosition - neutralPoint;
        const cmAlpha = -0.1; // 攻角产生的力矩系数
        return cmAlpha * angleOfAttack + stabilityMargin * 0.5;
    }

    // 计算气动力（世界坐标系）
    // velocity: THREE.Vector3 (m/s)
    // wingArea: 机翼面积 m²
    // chord: 平均气动弦长 m
    // cgPosition: 重心位置 (% 弦长)
    // pitchAngle: 飞机俯仰角 rad
    computeForces(velocity, wingArea, chord, cgPosition, pitchAngle) {
        const v = velocity.length();
        if (v < 0.1) {
            return {
                lift: new THREE.Vector3(0, 0, 0),
                drag: new THREE.Vector3(0, 0, 0),
                moment: 0,
                cl: 0,
                cd: 0,
                cm: 0,
                aoa: 0,
            };
        }

        // 速度方向（来流方向）
        const vDir = velocity.clone().normalize();

        // 攻角：速度矢量与机翼弦线的夹角
        // 飞机 x 轴向前，y 轴向上
        // 飞行轨迹角：速度矢量与水平面的夹角
        const flightPathAngle = Math.atan2(vDir.y, Math.sqrt(vDir.x * vDir.x + vDir.z * vDir.z));
        // 攻角 = 俯仰角 - 轨迹角
        const angleOfAttack = pitchAngle - flightPathAngle;

        const cl = this.computeCL(angleOfAttack);
        const cd = this.computeCD(angleOfAttack);
        const cm = this.computeCM(angleOfAttack, cgPosition);

        // 动压 q = 0.5 * ρ * v²
        const q = 0.5 * this.rho * v * v;

        // 升力大小
        const liftMagnitude = q * wingArea * Math.abs(cl);
        // 阻力大小（与速度反向）
        const dragMagnitude = q * wingArea * cd;
        // 力矩大小
        const momentMagnitude = q * wingArea * chord * cm;

        // 升力方向：垂直于速度方向，指向飞机上方
        // 飞机上方在 world 中的方向：考虑俯仰角，飞机上方 = (-sin(pitch), cos(pitch), 0)
        // 升力应垂直于速度，在飞机对称面内
        const planeUp = new THREE.Vector3(-Math.sin(pitchAngle), Math.cos(pitchAngle), 0).normalize();

        // 升力方向 = planeUp 投影到垂直于速度方向的平面
        // 即 liftDir = planeUp - (planeUp · vDir) * vDir，然后归一化
        const dot = planeUp.dot(vDir);
        const liftDir = planeUp.clone().sub(vDir.clone().multiplyScalar(dot)).normalize();

        // 如果 liftDir 太小（速度几乎垂直），使用默认向上
        if (liftDir.lengthSq() < 0.001 || isNaN(liftDir.x)) {
            liftDir.set(0, 1, 0);
        }

        // 根据 cl 符号调整方向（正 cl 产生向上升力）
        const lift = liftDir.multiplyScalar(liftMagnitude * Math.sign(cl));

        // 阻力方向：与速度反向
        const drag = vDir.clone().multiplyScalar(-dragMagnitude);

        return {
            lift,
            drag,
            moment: momentMagnitude,
            cl,
            cd,
            cm,
            aoa: angleOfAttack * (180 / Math.PI),
        };
    }

    // 计算重力
    computeGravity(mass) {
        return new THREE.Vector3(0, -mass * this.g, 0);
    }
}
