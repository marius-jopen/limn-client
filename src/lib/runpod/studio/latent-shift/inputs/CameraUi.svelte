<script lang="ts">
    export let id: string;
    export let label: string;
    export let value: {
        x: string;
        y: string;
        z: string;
        center_x: string;
        center_y: string;
        rotation_x: string;
        rotation_y: string;
        rotation_z: string;
    };

    // Default values if none provided
    $: if (!value) {
        value = {
            x: "0: (0)",
            y: "0: (0)",
            z: "0: (0)",
            center_x: "0: (0)",
            center_y: "0: (0)",
            rotation_x: "0: (0)",
            rotation_y: "0: (0)",
            rotation_z: "0: (0)"
        };
    }

    const step = 0.05;
    const min = -2;
    const max = 2;

    function updateValue(key: keyof typeof value, increment: boolean) {
        const currentStr = value[key];
        const currentValue = parseFloat(currentStr.split('(')[1].split(')')[0]);
        let newValue = increment ? currentValue + step : currentValue - step;
        newValue = Math.max(min, Math.min(max, Number(newValue.toFixed(2))));
        value[key] = `0: (${newValue})`;
    }

    function createControlGroup(label: string, icon: string, value: string, key: keyof typeof value) {
        return {label, icon, value, key};
    }

    // Updated icons for more tech feel
    const translationControls = [
        createControlGroup("X Pan", "⬅️", value.x, "x"),
        createControlGroup("Y Pan", "⬆️", value.y, "y"),
        createControlGroup("Z Pan", "⭐", value.z, "z"),
    ];

    const centerControls = [
        createControlGroup("Center X", "◀", value.center_x, "center_x"),
        createControlGroup("Center Y", "▲", value.center_y, "center_y"),
    ];

    const rotationControls = [
        createControlGroup("X Rotation", "⟳", value.rotation_x, "rotation_x"),
        createControlGroup("Y Rotation", "⟳", value.rotation_y, "rotation_y"),
        createControlGroup("Z Rotation", "⟳", value.rotation_z, "rotation_z"),
    ];

    function resetAll() {
        value = {
            x: "0: (0)",
            y: "0: (0)",
            z: "0: (0)",
            center_x: "0: (0)",
            center_y: "0: (0)",
            rotation_x: "0: (0)",
            rotation_y: "0: (0)",
            rotation_z: "0: (0)"
        };
    }
</script>

<div class="camera-ui">
    <div class="header">
        <h3 class="title">{label}</h3>
        <button class="reset-button" on:click={resetAll}>Reset</button>
    </div>
    
    <div class="controls-container">
        <!-- Translation Pod -->
        <div class="control-pod">
            <h4>Translation</h4>
            <div class="control-wheel">
                <button class="wheel-button top" on:click={() => updateValue('y', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right" on:click={() => updateValue('x', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom" on:click={() => updateValue('y', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left" on:click={() => updateValue('x', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="z-control top" on:click={() => updateValue('z', true)}>▲</button>
                    <button class="z-control bottom" on:click={() => updateValue('z', false)}>▼</button>
                </div>
            </div>
            <div class="value-display">
                <div>X: {value.x}</div>
                <div>Y: {value.y}</div>
                <div>Z: {value.z}</div>
            </div>
        </div>

        <!-- Center Pod -->
        <div class="control-pod">
            <h4>Center</h4>
            <div class="control-wheel">
                <button class="wheel-button top" on:click={() => updateValue('center_y', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right" on:click={() => updateValue('center_x', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom" on:click={() => updateValue('center_y', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left" on:click={() => updateValue('center_x', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="center-dot" on:click={resetAll}></button>
                </div>
            </div>
            <div class="value-display">
                <div>X: {value.center_x}</div>
                <div>Y: {value.center_y}</div>
                <div class="uppercase">Reset all</div>
            </div>
        </div>

        <!-- Rotation Pod -->
        <div class="control-pod">
            <h4>Rotation</h4>
            <div class="control-wheel">
                <button class="wheel-button top" on:click={() => updateValue('rotation_x', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right" on:click={() => updateValue('rotation_y', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom" on:click={() => updateValue('rotation_x', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left" on:click={() => updateValue('rotation_y', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="z-control top" on:click={() => updateValue('rotation_z', true)}>▲</button>
                    <button class="z-control bottom" on:click={() => updateValue('rotation_z', false)}>▼</button>
                </div>
            </div>
            <div class="value-display">
                <div>X: {value.rotation_x}</div>
                <div>Y: {value.rotation_y}</div>
                <div>Z: {value.rotation_z}</div>
            </div>
        </div>
    </div>
</div>

<style>
    .camera-ui {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 10px;
    }

    .header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 10px;
    }

    .title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        text-align: center;
        margin: 0;
    }

    .controls-container {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .control-pod {
        background: #f5f5f7;
        border-radius: 12px;
        padding: 12px;
        width: 160px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .control-pod h4 {
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;
        color: #1d1d1f;
    }

    .control-wheel {
        position: relative;
        width: 140px;
        height: 140px;
        margin: 0 auto;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .wheel-button {
        position: absolute;
        width: 30px;
        height: 30px;
        border: none;
        background: transparent;
        color: #1d1d1f;
        font-size: 14px;
        cursor: pointer;
        transition: color 0.2s;
    }

    .wheel-button:hover {
        color: var(--color-primary);
    }

    .wheel-button.top { top: 15px; left: 50%; transform: translateX(-50%); }
    .wheel-button.right { right: 15px; top: 50%; transform: translateY(-50%); }
    .wheel-button.bottom { bottom: 15px; left: 50%; transform: translateX(-50%); }
    .wheel-button.left { left: 15px; top: 50%; transform: translateY(-50%); }

    .center-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f0f0f2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .z-control {
        flex: 1;
        width: 100%;
        border: none;
        background: transparent;
        color: #1d1d1f;
        font-size: 12px;
        cursor: pointer;
        padding: 0;
        transition: color 0.2s;
    }

    .z-control:hover {
        color: var(--color-primary);
    }

    .z-control.top {
        border-bottom: 1px solid #e5e5e7;
    }

    .value-display {
        margin-top: 8px;
        text-align: center;
        font-size: 11px;
        color: #666;
    }

    .value-display div {
        margin: 2px 0;
        font-family: "SF Mono", monospace;
    }

    .reset-button {
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 8px;
        border: none;
        background-color: #f5f5f7;
        color: var(--color-primary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .reset-button:hover {
        background-color: #e5e5e7;
    }

    .reset-button:active {
        transform: scale(0.96);
    }

    .center-dot {
        width: 10px;
        height: 10px;
        border: none;
        background: #333333;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .center-dot:hover {
        background: var(--color-primary);
    }
</style>
