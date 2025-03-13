<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import InputTextarea from '$lib/atoms/InputTextarea.svelte';
    import Label from '$lib/atoms/Label.svelte';

    // Frame number variables
    export let startFrame = 0;
    export let endFrame = 20;

    export let id: string;
    export let label: string;
    export let value: string = '{}';

    const dispatch = createEventDispatcher();

    // Parse the initial value or start with an empty object
    let prompts: { [frame: string]: string } = {};
    try {
        if (value && value !== '{}') {
            prompts = JSON.parse(value);
        }
    } catch (e) {
        console.error('Error parsing prompts value:', e);
    }

    // Initialize with two prompts
    let prompt1 = prompts[startFrame.toString()] || '';
    let prompt2 = prompts[endFrame.toString()] || '';

    // Update the value when prompts change
    function updateValue() {
        prompts = {};
        if (prompt1) {
            prompts[startFrame.toString()] = prompt1;
        }
        if (prompt2) {
            prompts[endFrame.toString()] = prompt2;
        }
        value = JSON.stringify(prompts);
        dispatch('change', value);
    }

    // Watch for changes in prompt values
    $: {
        if (prompt1 !== undefined || prompt2 !== undefined) {
            updateValue();
        }
    }
</script>

<div class="mb-6 w-full">    
    <div class="flex flex-col gap-4 mb-4">
        <div class="flex flex-col">
            <Label 
                for_id={`${id}-prompt1`} 
                label={`Prompt 1 (Frame ${startFrame})`} 
            />
            <InputTextarea 
                id={`${id}-prompt1`} 
                bind:value={prompt1} 
            />
        </div>

        <!-- <div class="flex flex-col">
            <Label 
                for_id={`${id}-prompt2`} 
                label={`Prompt 2 (Frame ${endFrame})`} 
            />
            <InputTextarea 
                id={`${id}-prompt2`} 
                bind:value={prompt2} 
            />
        </div> -->
    </div>
    
    <input type="hidden" {id} {value} />
</div>
