<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import { onMount } from 'svelte';
    
    export let id: string = '';
    export let label: string = '';
    export let value: string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
    export let hidden: boolean = false;
    // Local state for width and height
    let widthValue = '';
    let heightValue = '';
    
    // Initialize from parent value
    $: {
        if (value) {
            const parts = value.split(',').map(v => v.trim());
            if (parts[0] !== widthValue) widthValue = parts[0];
            if (parts.length > 1 && parts[1] !== heightValue) heightValue = parts[1];
        }
    }
    
    // Update parent value when width changes
    function handleWidthChange(e) {
        widthValue = e.target.value;
        updateParentValue();
    }
    
    // Update parent value when height changes
    function handleHeightChange(e) {
        heightValue = e.target.value;
        updateParentValue();
    }
    
    // Update the parent value
    function updateParentValue() {
        value = `${widthValue}, ${heightValue}`;
        console.log(`FormatUi updated: W=${widthValue}, H=${heightValue}, value="${value}"`);
    }
</script>

<div class="flex flex-col gap-1 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <div class="flex gap-2">
        <div class="flex-1">
            <Label for_id={`${id}-width`} label="Width" />
            <input 
                id={`${id}-width`} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                value={widthValue}
                placeholder="Width" 
                {disabled}
                on:input={handleWidthChange}
            />
        </div>
        <div class="flex-1">
            <Label for_id={`${id}-height`} label="Height" />
            <input 
                id={`${id}-height`} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                value={heightValue}
                placeholder="Height" 
                {disabled}
                on:input={handleHeightChange}
            />
        </div>
    </div>
</div>
