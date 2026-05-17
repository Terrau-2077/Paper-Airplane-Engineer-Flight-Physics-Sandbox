// 力矢量可视化
// 用箭头显示升力(绿)、阻力(红)、重力(蓝)

import * as THREE from 'three';

export class ForceArrows {
    constructor(scene) {
        this.scene = scene;
        this.arrows = {};
        this.scale = 0.02; // 力到箭头长度的缩放因子
        this.init();
    }

    init() {
        // 升力箭头 - 绿色
        this.arrows.lift = this.createArrow(0x00ff00);
        // 阻力箭头 - 红色
        this.arrows.drag = this.createArrow(0xff0000);
        // 重力箭头 - 蓝色
        this.arrows.gravity = this.createArrow(0x0088ff);
        // 合力箭头 - 黄色
        this.arrows.total = this.createArrow(0xffff00);

        // 默认隐藏
        this.setVisible(false);
    }

    createArrow(color) {
        const dir = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        const length = 1;
        const hex = color;
        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex, 0.2, 0.1);
        this.scene.add(arrowHelper);
        return arrowHelper;
    }

    update(position, forces) {
        const { lift, drag, gravity } = forces;

        // 更新升力箭头
        if (lift && lift.lengthSq() > 0.0001) {
            this.arrows.lift.position.copy(position);
            this.arrows.lift.setDirection(lift.clone().normalize());
            this.arrows.lift.setLength(Math.max(0.1, lift.length() * this.scale), 0.15, 0.08);
        }

        // 更新阻力箭头
        if (drag && drag.lengthSq() > 0.0001) {
            this.arrows.drag.position.copy(position);
            this.arrows.drag.setDirection(drag.clone().normalize());
            this.arrows.drag.setLength(Math.max(0.1, drag.length() * this.scale), 0.15, 0.08);
        }

        // 更新重力箭头
        if (gravity && gravity.lengthSq() > 0.0001) {
            this.arrows.gravity.position.copy(position);
            this.arrows.gravity.setDirection(gravity.clone().normalize());
            this.arrows.gravity.setLength(Math.max(0.1, gravity.length() * this.scale), 0.15, 0.08);
        }

        // 计算合力
        if (lift && drag && gravity) {
            const total = lift.clone().add(drag).add(gravity);
            if (total.lengthSq() > 0.0001) {
                this.arrows.total.position.copy(position);
                this.arrows.total.setDirection(total.clone().normalize());
                this.arrows.total.setLength(Math.max(0.1, total.length() * this.scale), 0.15, 0.08);
            }
        }
    }

    setVisible(visible) {
        Object.values(this.arrows).forEach(arrow => {
            arrow.visible = visible;
        });
    }

    setScale(scale) {
        this.scale = scale;
    }
}
