// 纸飞机预设参数

export const PRESETS = {
    default: {
        name: '默认',
        wingArea: 0.04,
        cgPosition: 0.28,
        sweepAngle: 8,
        dihedralAngle: 6,
        launchSpeed: 14,
        launchAngle: 12,
    },
    distance: {
        name: '远距离',
        wingArea: 0.025,
        cgPosition: 0.22,
        sweepAngle: 20,
        dihedralAngle: 3,
        launchSpeed: 18,
        launchAngle: 8,
    },
    duration: {
        name: '长滞空',
        wingArea: 0.055,
        cgPosition: 0.32,
        sweepAngle: 5,
        dihedralAngle: 12,
        launchSpeed: 12,
        launchAngle: 25,
    },
};

export function applyPreset(presetName, sliders) {
    const preset = PRESETS[presetName];
    if (!preset) return null;

    sliders.wingArea.value = preset.wingArea;
    sliders.cgPosition.value = preset.cgPosition * 100;
    sliders.sweepAngle.value = preset.sweepAngle;
    sliders.dihedralAngle.value = preset.dihedralAngle;
    sliders.launchSpeed.value = preset.launchSpeed;
    sliders.launchAngle.value = preset.launchAngle;

    // 触发更新事件
    Object.values(sliders).forEach(s => s.dispatchEvent(new Event('input')));

    return preset;
}
