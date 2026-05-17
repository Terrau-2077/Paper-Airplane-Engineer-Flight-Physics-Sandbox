// 主入口文件
// 初始化 Three.js 场景、物理模拟、UI 交互

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PaperPlane } from './plane/PaperPlane.js';
import { Aerodynamics } from './core/Aerodynamics.js';
import { FlightState } from './core/FlightState.js';
import { Launcher } from './simulation/Launcher.js';
import { Mission } from './simulation/Mission.js';
import { ForceArrows } from './visualization/ForceArrows.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { HUD } from './ui/HUD.js';
import { ResultOverlay } from './ui/ResultOverlay.js';
import { applyPreset } from './plane/PlanePresets.js';

class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.plane = null;
        this.aero = null;
        this.flightState = null;
        this.launcher = null;
        this.mission = null;
        this.forceArrows = null;
        this.controlPanel = null;
        this.hud = null;
        this.resultOverlay = null;

        this.velocity = new THREE.Vector3();
        this.angularVelocity = 0; // 俯仰角速度
        this.timeStep = 1 / 60; // 固定时间步长

        this.init();
    }

    init() {
        console.log('[App] 初始化开始');
        this.initThree();
        this.initScene();
        this.initPlane();
        this.initPhysics();
        this.initUI();
        this.animate();
        console.log('[App] 初始化完成');
    }

    initThree() {
        const container = document.getElementById('canvas-container');

        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);

        // 相机
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(-3, 3, 5);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1, 0);

        // 窗口大小调整
        window.addEventListener('resize', () => this.onResize());
    }

    initScene() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambientLight);

        // 方向光（模拟太阳）
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(-10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // 地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a3a2a,
            roughness: 0.9,
            metalness: 0.0,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 网格辅助线
        const gridHelper = new THREE.GridHelper(200, 100, 0x444466, 0x2a2a3a);
        this.scene.add(gridHelper);

        // 距离标记（每 10m）
        for (let i = 10; i <= 100; i += 10) {
            const markerGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x666688 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(i, 0.25, 0);
            this.scene.add(marker);
        }
    }

    initPlane() {
        this.plane = new PaperPlane();
        this.plane.setPosition(0, 1.5, 0);
        this.plane.updateShape({
            wingArea: 0.03,
            cgPosition: 0.25,
            sweepAngle: 10,
            dihedralAngle: 5,
        });
        this.scene.add(this.plane.getMesh());
    }

    initPhysics() {
        this.aero = new Aerodynamics();
        this.flightState = new FlightState();
        this.launcher = new Launcher();
        this.mission = new Mission('distance');
        this.forceArrows = new ForceArrows(this.scene);
    }

    initUI() {
        this.controlPanel = new ControlPanel(
            (params) => this.onParamsChange(params),
            (params) => this.onLaunch(params),
            () => this.onReset(),
            (preset) => this.onPreset(preset)
        );
        this.hud = new HUD();
        this.resultOverlay = new ResultOverlay();
    }

    onParamsChange(params) {
        if (this.flightState.isIdle()) {
            this.plane.updateShape({
                wingArea: params.wingArea,
                cgPosition: params.cgPosition / 100,
                sweepAngle: params.sweepAngle,
                dihedralAngle: params.dihedralAngle,
            });
        }
    }

    onLaunch(params) {
        if (!this.flightState.isIdle()) return;

        console.log('[App] 发射，参数:', params);

        // 更新飞机形状
        this.plane.updateShape({
            wingArea: params.wingArea,
            cgPosition: params.cgPosition / 100,
            sweepAngle: params.sweepAngle,
            dihedralAngle: params.dihedralAngle,
        });

        // 计算发射速度
        this.velocity = this.launcher.computeLaunchVelocity(
            params.launchSpeed,
            params.launchAngle
        );
        this.angularVelocity = 0;

        // 设置初始位置和姿态
        const launchPos = this.launcher.getLaunchPosition();
        this.plane.setPosition(launchPos.x, launchPos.y, launchPos.z);
        // 俯仰角 = 发射仰角 + 初始攻角(8°)，确保发射时有足够升力
        const initialPitch = (params.launchAngle + 8) * (Math.PI / 180);
        this.plane.setRotation(initialPitch, 0, 0);

        // 启动飞行状态
        this.flightState.launch(launchPos);
        this.hud.show();
        this.forceArrows.setVisible(true);
        this.controlPanel.setEnabled(false);
    }

    onReset() {
        console.log('[App] 重置');
        this.flightState.reset();
        this.velocity.set(0, 0, 0);
        this.angularVelocity = 0;

        const launchPos = this.launcher.getLaunchPosition();
        this.plane.setPosition(launchPos.x, launchPos.y, launchPos.z);
        this.plane.setRotation(0, 0, 0);

        this.hud.hide();
        this.resultOverlay.hide();
        this.forceArrows.setVisible(false);
        this.controlPanel.setEnabled(true);

        // 重置相机
        this.camera.position.set(-3, 3, 5);
        this.controls.target.set(0, 1, 0);
    }

    onPreset(presetName) {
        if (!this.flightState.isIdle()) return;
        applyPreset(presetName, this.controlPanel.sliders);
    }

    updatePhysics() {
        if (!this.flightState.isFlying()) return;

        const pos = this.plane.getPosition();
        const rot = this.plane.getRotation();

        // 调试：每 60 帧输出一次物理状态
        if (!this._frameCount) this._frameCount = 0;
        this._frameCount++;
        const shouldLog = this._frameCount % 60 === 1;

        // 获取物理参数
        const wingArea = this.plane.params.wingArea;
        const chord = this.plane.getChord();
        const cgPosition = this.plane.params.cgPosition;
        const mass = this.plane.getMass();
        const pitchAngle = rot.x; // 俯仰角

        // 计算气动力
        const aeroForces = this.aero.computeForces(
            this.velocity,
            wingArea,
            chord,
            cgPosition,
            pitchAngle
        );

        // 计算重力
        const gravity = this.aero.computeGravity(mass);

        // 合力
        const totalForce = new THREE.Vector3()
            .add(aeroForces.lift)
            .add(aeroForces.drag)
            .add(gravity);

        if (shouldLog) {
            console.log('[Physics] v:', this.velocity.length().toFixed(2),
                'pos:', pos.x.toFixed(1), pos.y.toFixed(1),
                'lift:', aeroForces.lift.length().toFixed(3),
                'drag:', aeroForces.drag.length().toFixed(3),
                'grav:', gravity.length().toFixed(3),
                'aoa:', aeroForces.aoa.toFixed(1),
                'cl:', aeroForces.cl.toFixed(2));
        }

        // 加速度 F = ma
        const acceleration = totalForce.clone().divideScalar(mass);

        // 速度更新（欧拉积分）
        this.velocity.add(acceleration.multiplyScalar(this.timeStep));

        // 速度阻尼（数值稳定性）
        this.velocity.multiplyScalar(0.999);

        // 限制最大速度
        const maxSpeed = 30;
        if (this.velocity.length() > maxSpeed) {
            this.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // 位置更新
        const deltaPos = this.velocity.clone().multiplyScalar(this.timeStep);
        const oldY = pos.y;
        pos.add(deltaPos);
        if (shouldLog) {
            console.log('[Physics] deltaPos:', deltaPos.x.toFixed(3), deltaPos.y.toFixed(3), deltaPos.z.toFixed(3),
                'oldY:', oldY.toFixed(2), 'newY:', pos.y.toFixed(2));
        }

        // 俯仰动力学：使用简化的纵向稳定性模型
        // 目标：保持合理的攻角，避免剧烈振荡
        const momentOfInertia = mass * chord * chord * 0.8;
        const angularAcceleration = aeroForces.moment / momentOfInertia;
        this.angularVelocity += angularAcceleration * this.timeStep;

        // 强阻尼防止振荡
        this.angularVelocity *= 0.9;

        // 俯仰角更新
        rot.x += this.angularVelocity * this.timeStep;

        // 限制俯仰角（±45°）
        rot.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rot.x));

        // 机头始终对准速度方向（简化 2D 纵向运动）
        if (this.velocity.length() > 0.5) {
            const velDir = this.velocity.clone().normalize();
            const flightPathAngle = Math.atan2(velDir.y, velDir.x);
            // 机头方向 = 轨迹方向 + 当前攻角
            // 这样保持攻角稳定，避免正反馈
            rot.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rot.x));
            rot.y = Math.atan2(velDir.z, velDir.x);
        }

        // 地面碰撞检测
        if (pos.y <= 0.05) {
            pos.y = 0.05;
            this.velocity.y = Math.abs(this.velocity.y) * 0.3; // 弹跳
            this.velocity.x *= 0.7; // 地面摩擦
            this.velocity.z *= 0.7;
            this.angularVelocity *= 0.5;

            // 速度很小且接近地面时判定落地
            if (this.velocity.length() < 1 && pos.y < 0.1) {
                this.flightState.land();
                this.onFlightEnd();
            }
        }

        // 更新飞行状态数据
        this.flightState.update(pos);

        // 更新力箭头
        this.forceArrows.update(pos, {
            lift: aeroForces.lift,
            drag: aeroForces.drag,
            gravity: gravity,
        });

        // 更新 HUD
        const ld = aeroForces.cd > 0.001 ? aeroForces.cl / aeroForces.cd : 0;
        this.hud.update({
            speed: this.velocity.length(),
            altitude: Math.max(0, pos.y),
            distance: this.flightState.totalDistance,
            aoa: aeroForces.aoa,
            ld: Math.abs(ld),
            time: this.flightState.duration,
        });

        // 相机跟随
        const cameraOffset = new THREE.Vector3(-5, 3, 0);
        const targetPos = pos.clone().add(cameraOffset);
        this.camera.position.lerp(targetPos, 0.05);
        this.controls.target.lerp(pos, 0.1);
    }

    onFlightEnd() {
        console.log('[App] 飞行结束');
        this.forceArrows.setVisible(false);
        this.hud.hide();

        const result = this.mission.evaluate(this.flightState);
        this.resultOverlay.show(result.distance, result.duration);
        this.controlPanel.setEnabled(true);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        this.updatePhysics();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动应用
new App();
