// 纸飞机 3D 模型
// 基于参数实时变形：机翼面积、重心、后掠角、上反角

import * as THREE from 'three';

export class PaperPlane {
    constructor() {
        this.mesh = null;
        this.cgMarker = null;
        this.params = {
            wingArea: 0.03,
            cgPosition: 0.25,
            sweepAngle: 10,
            dihedralAngle: 5,
        };
        this.baseGeometry = null;
        this.init();
    }

    init() {
        // 创建纸飞机 Mesh
        this.mesh = this.createPlaneMesh();
        this.cgMarker = this.createCGMarker();
        this.mesh.add(this.cgMarker);
    }

    createPlaneMesh() {
        // 纸飞机几何：简化三角翼 + 机身
        // 使用 BufferGeometry 以便实时修改顶点
        const geometry = new THREE.BufferGeometry();

        // 初始顶点（对称翼，沿 x 轴向前）
        // 机身前缘在原点，向后延伸
        const vertices = new Float32Array([
            // 左翼（上表面）
            0, 0, 0,      // 机头
            -0.3, 0, 0.2, // 左翼根后缘
            -0.5, 0, 0,   // 左翼尖

            // 右翼（上表面）
            0, 0, 0,      // 机头
            0.5, 0, 0,    // 右翼尖
            0.3, 0, 0.2,  // 右翼根后缘

            // 左翼（下表面）
            0, -0.02, 0,
            -0.5, -0.02, 0,
            -0.3, -0.02, 0.2,

            // 右翼（下表面）
            0, -0.02, 0,
            0.3, -0.02, 0.2,
            0.5, -0.02, 0,
        ]);

        const indices = [
            0, 1, 2,    // 左上
            3, 4, 5,    // 右上
            6, 7, 8,    // 左下
            9, 10, 11,  // 右下
        ];

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        this.baseGeometry = geometry.clone();

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.0,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    createCGMarker() {
        // 重心标记：小红球
        const geometry = new THREE.SphereGeometry(0.015, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff3333 });
        const marker = new THREE.Mesh(geometry, material);
        return marker;
    }

    // 根据参数更新飞机形状
    updateShape(params) {
        this.params = { ...this.params, ...params };
        const { wingArea, cgPosition, sweepAngle, dihedralAngle } = this.params;

        // 从 wingArea 计算翼展和弦长
        // 假设翼展/弦长比 AR ≈ 3
        const aspectRatio = 3.0;
        const chord = Math.sqrt(wingArea / aspectRatio);
        const span = aspectRatio * chord;

        // 角度转弧度
        const sweepRad = sweepAngle * (Math.PI / 180);
        const dihedralRad = dihedralAngle * (Math.PI / 180);

        // 重新计算顶点
        // 坐标系：x 向前，y 向上，z 向右（翼展方向）
        // 机头在 (0, 0, 0)
        // 翼根后缘在 (-chord, 0, ±chord/2)
        // 翼尖在 (-chord + span/2 * sin(sweep), span/2 * sin(dihedral), ±span/2 * cos(sweep))

        const halfSpan = span / 2;
        const rootChord = chord;
        const tipChord = chord * 0.6; // 翼尖弦长稍短

        // 左翼尖位置（考虑后掠和上反）
        const tipX = -rootChord + halfSpan * Math.sin(sweepRad);
        const tipY = halfSpan * Math.sin(dihedralRad);
        const tipZ = halfSpan * Math.cos(sweepRad);

        // 翼根后缘
        const rootX = -rootChord;
        const rootY = 0;
        const rootZ = chord * 0.3; // 翼根宽度

        const positions = this.mesh.geometry.attributes.position.array;

        // 上表面 - 左翼
        positions[0] = 0; positions[1] = 0; positions[2] = 0; // 机头
        positions[3] = rootX; positions[4] = rootY; positions[5] = rootZ; // 翼根后缘
        positions[6] = tipX; positions[7] = tipY; positions[8] = tipZ; // 翼尖

        // 上表面 - 右翼
        positions[9] = 0; positions[10] = 0; positions[11] = 0; // 机头
        positions[12] = tipX; positions[13] = tipY; positions[14] = -tipZ; // 翼尖
        positions[15] = rootX; positions[16] = rootY; positions[17] = -rootZ; // 翼根后缘

        // 下表面 - 左翼
        positions[18] = 0; positions[19] = -0.02; positions[20] = 0;
        positions[21] = tipX; positions[22] = tipY - 0.02; positions[23] = tipZ;
        positions[24] = rootX; positions[25] = rootY - 0.02; positions[26] = rootZ;

        // 下表面 - 右翼
        positions[27] = 0; positions[28] = -0.02; positions[29] = 0;
        positions[30] = rootX; positions[31] = rootY - 0.02; positions[32] = -rootZ;
        positions[33] = tipX; positions[34] = tipY - 0.02; positions[35] = -tipZ;

        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();

        // 更新重心标记位置
        // cgPosition 是 % 弦长，从前缘起
        // 平均气动弦长在翼根附近
        const cgX = -cgPosition * rootChord;
        this.cgMarker.position.set(cgX, 0, 0);

        // 更新质量（与面积成正比，假设面密度）
        // 纸的面密度约 50g/m²，但这里需要合理缩放使物理稳定
        this.mass = Math.max(0.005, wingArea * 0.5); // kg, 最小 5g
    }

    getMesh() {
        return this.mesh;
    }

    getMass() {
        return this.mass || 0.0015; // 默认约 1.5g
    }

    // 获取平均气动弦长
    getChord() {
        const aspectRatio = 3.0;
        return Math.sqrt(this.params.wingArea / aspectRatio);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(pitch, yaw, roll) {
        this.mesh.rotation.set(pitch, yaw, roll);
    }

    getPosition() {
        return this.mesh.position;
    }

    getRotation() {
        return this.mesh.rotation;
    }
}
