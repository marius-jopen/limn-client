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

    let hoveredValue: string | null = null;
</script>

<div class="font-sans max-w-[800px] mx-auto p-2.5">
   
    <div class="flex gap-2.5 justify-center bg-gray-100 rounded-xl p-4 w-fit mx-auto">
        <!-- Translation Pod -->
        <div class="p-3 w-40">
            <h4 class="text-center text-sm font-medium mb-2 text-gray-800">Translation</h4>
            <div class="control-wheel">
                <button class="wheel-button top" 
                    on:mouseenter={() => hoveredValue = 'y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('y', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right"
                    on:mouseenter={() => hoveredValue = 'x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('x', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom" 
                    on:mouseenter={() => hoveredValue = 'y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('y', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left"
                    on:mouseenter={() => hoveredValue = 'x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('x', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="z-control top"
                        on:mouseenter={() => hoveredValue = 'z'}
                        on:mouseleave={() => hoveredValue = null}
                        on:click={() => updateValue('z', true)}>▲</button>
                    <button class="z-control bottom"
                        on:mouseenter={() => hoveredValue = 'z'}
                        on:mouseleave={() => hoveredValue = null}
                        on:click={() => updateValue('z', false)}>▼</button>
                </div>
            </div>
            <div class="value-display">
                <div class:highlight={hoveredValue === 'x'}>X: {value.x}</div>
                <div class:highlight={hoveredValue === 'y'}>Y: {value.y}</div>
                <div class:highlight={hoveredValue === 'z'}>Z: {value.z}</div>
            </div>
        </div>

        <!-- Center Pod -->
        <div class="bg-gray-100 rounded-xl p-3 w-40 ">
            <h4 class="text-center text-sm font-medium mb-2 text-gray-800">Center</h4>
            <div class="control-wheel">
                <button class="wheel-button top" 
                    on:mouseenter={() => hoveredValue = 'center_y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('center_y', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right"
                    on:mouseenter={() => hoveredValue = 'center_x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('center_x', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom"
                    on:mouseenter={() => hoveredValue = 'center_y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('center_y', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left"
                    on:mouseenter={() => hoveredValue = 'center_x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('center_x', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="center-dot" 
                        on:mouseenter={() => hoveredValue = 'reset'}
                        on:mouseleave={() => hoveredValue = null}
                        on:click={resetAll}></button>
                </div>
            </div>
            <div class="value-display">
                <div class:highlight={hoveredValue === 'center_x'}>X: {value.center_x}</div>
                <div class:highlight={hoveredValue === 'center_y'}>Y: {value.center_y}</div>
                <div class:highlight={hoveredValue === 'reset'}>Reset all</div>
            </div>
        </div>

        <!-- Rotation Pod -->
        <div class="bg-gray-100 rounded-xl p-3 w-40 ">
            <h4 class="text-center text-sm font-medium mb-2 text-gray-800">Rotation</h4>
            <div class="control-wheel">
                <button class="wheel-button top"
                    on:mouseenter={() => hoveredValue = 'rotation_x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('rotation_x', true)}>
                    <span>▲</span>
                </button>
                <button class="wheel-button right"
                    on:mouseenter={() => hoveredValue = 'rotation_y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('rotation_y', true)}>
                    <span>▶</span>
                </button>
                <button class="wheel-button bottom"
                    on:mouseenter={() => hoveredValue = 'rotation_x'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('rotation_x', false)}>
                    <span>▼</span>
                </button>
                <button class="wheel-button left"
                    on:mouseenter={() => hoveredValue = 'rotation_y'}
                    on:mouseleave={() => hoveredValue = null}
                    on:click={() => updateValue('rotation_y', false)}>
                    <span>◀</span>
                </button>
                <div class="center-button">
                    <button class="z-control top"
                        on:mouseenter={() => hoveredValue = 'rotation_z'}
                        on:mouseleave={() => hoveredValue = null}
                        on:click={() => updateValue('rotation_z', true)}>▲</button>
                    <button class="z-control bottom"
                        on:mouseenter={() => hoveredValue = 'rotation_z'}
                        on:mouseleave={() => hoveredValue = null}
                        on:click={() => updateValue('rotation_z', false)}>▼</button>
                </div>
            </div>
            <div class="value-display">
                <div class:highlight={hoveredValue === 'rotation_x'}>X: {value.rotation_x}</div>
                <div class:highlight={hoveredValue === 'rotation_y'}>Y: {value.rotation_y}</div>
                <div class:highlight={hoveredValue === 'rotation_z'}>Z: {value.rotation_z}</div>
            </div>
        </div>
    </div>
</div>

<style>
    /* We only keep styles that can't be easily done with Tailwind */
    .control-wheel {
        position: relative;
        width: 140px;
        height: 140px;
        margin: 0 auto;
        border-radius: 50%;
        @apply bg-white ;
    }

    .wheel-button {
        position: absolute;
        width: 30px;
        height: 30px;
        border: none;
        @apply bg-transparent text-gray-800 text-sm cursor-pointer transition-colors;
    }

    .wheel-button:hover {
        @apply text-primary;
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
        @apply bg-gray-100 rounded-full flex flex-col items-center justify-center overflow-hidden;
    }

    .center-dot {
        width: 10px;
        height: 10px;
        @apply border-none bg-gray-700 rounded-full cursor-pointer transition-colors;
    }

    .center-dot:hover {
        @apply bg-primary;
    }

    .z-control {
        flex: 1;
        width: 100%;
        @apply border-none bg-transparent text-gray-800 text-xs cursor-pointer p-0 transition-colors;
    }

    .z-control:hover {
        @apply text-primary;
    }

    .z-control.top {
        border-bottom: 1px solid #e5e5e7;
    }

    .value-display {
        @apply mt-2 text-center text-xs text-gray-600;
    }

    .value-display div {
        @apply my-0.5 font-mono;
    }

    .value-display div.highlight {
        @apply text-primary;
    }
</style>
