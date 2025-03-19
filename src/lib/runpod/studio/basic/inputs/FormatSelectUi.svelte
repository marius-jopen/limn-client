<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import { onMount } from 'svelte';
    
    export let id: string = '';
    export let label: string = '';
    export let value: string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
    
    // Predefined aspect ratios
    const aspectRatios = [
        { label: '16:9', value: '16:9' },
        { label: '3:2', value: '3:2' },
        { label: '1:1', value: '1:1' },
        { label: '2:3', value: '2:3' },
        { label: '9:16', value: '9:16' }
    ];
    
    let selectedRatio = '1:1';
    
    function calculateDimensions(ratio: string): { width: number, height: number } {
        const [w, h] = ratio.split(':').map(Number);
        
        if (w >= h) {
            // Landscape or square: width is 1024
            return {
                width: 1024,
                height: Math.round(1024 * (h / w))
            };
        } else {
            // Portrait: height is 1024
            return {
                width: Math.round(1024 * (w / h)),
                height: 1024
            };
        }
    }
    
    function handleRatioChange(e) {
        selectedRatio = e.target.value;
        updateParentValue();
    }
    
    function updateParentValue() {
        const { width, height } = calculateDimensions(selectedRatio);
        value = `${width}, ${height}`;
        console.log(`FormatSelectUi updated: ratio=${selectedRatio}, W=${width}, H=${height}, value="${value}"`);
    }
    
    // Try to determine the initial ratio from the incoming value
    onMount(() => {
        if (value) {
            const [w, h] = value.split(',').map(v => parseInt(v.trim(), 10));
            
            // Check if it matches one of our predefined ratios
            for (const option of aspectRatios) {
                const [rw, rh] = option.value.split(':').map(Number);
                
                // Allow for some rounding error
                if (Math.abs((w / h) - (rw / rh)) < 0.01) {
                    selectedRatio = option.value;
                    break;
                }
            }
            
            // If we didn't find a match, just update with current ratio
            updateParentValue();
        } else {
            // Initialize with default ratio if no value provided
            updateParentValue();
        }
    });
</script>

<div class="flex flex-col gap-1">
    <Label for_id={id} {label} />
    <div class="flex flex-col gap-2">
        <select
            id={id}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={selectedRatio}
            {disabled}
            on:change={handleRatioChange}
        >
            {#each aspectRatios as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
        
        <div class="text-sm text-gray-500">
            {#if selectedRatio}
                {@const dims = calculateDimensions(selectedRatio)}
                Output dimensions: {dims.width}×{dims.height}px
            {/if}
        </div>
    </div>
</div>
