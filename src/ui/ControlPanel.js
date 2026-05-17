// 参数面板控制
// 绑定滑块事件，管理参数状态

export class ControlPanel {
    constructor(onParamsChange, onLaunch, onReset, onPreset) {
        this.sliders = {};
        this.values = {};
        this.onParamsChange = onParamsChange;
        this.onLaunch = onLaunch;
        this.onReset = onReset;
        this.onPreset = onPreset;
        this.init();
    }

    init() {
        // 获取 DOM 元素
        this.sliders.wingArea = document.getElementById('wingArea');
        this.sliders.cgPosition = document.getElementById('cgPosition');
        this.sliders.sweepAngle = document.getElementById('sweepAngle');
        this.sliders.dihedralAngle = document.getElementById('dihedralAngle');
        this.sliders.launchSpeed = document.getElementById('launchSpeed');
        this.sliders.launchAngle = document.getElementById('launchAngle');

        this.values.wingArea = document.getElementById('wingArea-val');
        this.values.cgPosition = document.getElementById('cgPosition-val');
        this.values.sweepAngle = document.getElementById('sweepAngle-val');
        this.values.dihedralAngle = document.getElementById('dihedralAngle-val');
        this.values.launchSpeed = document.getElementById('launchSpeed-val');
        this.values.launchAngle = document.getElementById('launchAngle-val');

        // 绑定滑块事件
        this.sliders.wingArea.addEventListener('input', () => this.updateParams());
        this.sliders.cgPosition.addEventListener('input', () => this.updateParams());
        this.sliders.sweepAngle.addEventListener('input', () => this.updateParams());
        this.sliders.dihedralAngle.addEventListener('input', () => this.updateParams());
        this.sliders.launchSpeed.addEventListener('input', () => this.updateParams());
        this.sliders.launchAngle.addEventListener('input', () => this.updateParams());

        // 绑定按钮事件
        document.getElementById('launch-btn').addEventListener('click', () => {
            if (this.onLaunch) this.onLaunch(this.getParams());
        });
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });
        document.getElementById('result-reset-btn').addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });

        // 绑定预设按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                if (this.onPreset) this.onPreset(preset);
            });
        });

        // 初始更新
        this.updateParams();
    }

    updateParams() {
        const params = this.getParams();

        // 更新显示值
        this.values.wingArea.textContent = params.wingArea.toFixed(3) + ' m²';
        this.values.cgPosition.textContent = params.cgPosition.toFixed(0) + '%';
        this.values.sweepAngle.textContent = params.sweepAngle.toFixed(0) + '°';
        this.values.dihedralAngle.textContent = params.dihedralAngle.toFixed(0) + '°';
        this.values.launchSpeed.textContent = params.launchSpeed.toFixed(0) + ' m/s';
        this.values.launchAngle.textContent = params.launchAngle.toFixed(0) + '°';

        if (this.onParamsChange) {
            this.onParamsChange(params);
        }
    }

    getParams() {
        return {
            wingArea: parseFloat(this.sliders.wingArea.value),
            cgPosition: parseFloat(this.sliders.cgPosition.value),
            sweepAngle: parseFloat(this.sliders.sweepAngle.value),
            dihedralAngle: parseFloat(this.sliders.dihedralAngle.value),
            launchSpeed: parseFloat(this.sliders.launchSpeed.value),
            launchAngle: parseFloat(this.sliders.launchAngle.value),
        };
    }

    setSliders(params) {
        if (params.wingArea !== undefined) this.sliders.wingArea.value = params.wingArea;
        if (params.cgPosition !== undefined) this.sliders.cgPosition.value = params.cgPosition;
        if (params.sweepAngle !== undefined) this.sliders.sweepAngle.value = params.sweepAngle;
        if (params.dihedralAngle !== undefined) this.sliders.dihedralAngle.value = params.dihedralAngle;
        if (params.launchSpeed !== undefined) this.sliders.launchSpeed.value = params.launchSpeed;
        if (params.launchAngle !== undefined) this.sliders.launchAngle.value = params.launchAngle;
        this.updateParams();
    }

    setEnabled(enabled) {
        Object.values(this.sliders).forEach(s => s.disabled = !enabled);
        document.getElementById('launch-btn').disabled = !enabled;
    }
}
