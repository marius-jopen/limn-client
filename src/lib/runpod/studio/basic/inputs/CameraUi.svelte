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
</script>

<div class="camera-controls bg-gray-100 p-3 rounded-lg max-w-[800px] mx-auto mt-4">
    <h3 class="text-sm font-medium mb-2">{label}</h3>
    
    <div class="grid grid-cols-2 gap-4">
        <!-- Translation Controls -->
        <div class="space-y-2">
            <h4 class="text-xs font-medium text-gray-600">Translation</h4>
            <div class="flex flex-col gap-2">
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="X Translation"
                    bind:value={value.x}
                />
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Y Translation"
                    bind:value={value.y}
                />
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Z Translation"
                    bind:value={value.z}
                />
            </div>
        </div>

        <!-- Center Controls -->
        <div class="space-y-2">
            <h4 class="text-xs font-medium text-gray-600">Center</h4>
            <div class="flex flex-col gap-2">
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Center X"
                    bind:value={value.center_x}
                />
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Center Y"
                    bind:value={value.center_y}
                />
            </div>
        </div>

        <!-- Rotation Controls -->
        <div class="space-y-2 col-span-2">
            <h4 class="text-xs font-medium text-gray-600">Rotation</h4>
            <div class="grid grid-cols-3 gap-2">
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="X Rotation"
                    bind:value={value.rotation_x}
                />
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Y Rotation"
                    bind:value={value.rotation_y}
                />
                <input 
                    type="text"
                    class="w-full px-2 py-1 text-sm border rounded"
                    placeholder="Z Rotation"
                    bind:value={value.rotation_z}
                />
            </div>
        </div>
    </div>
</div>
