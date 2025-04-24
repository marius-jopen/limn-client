<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Label from '$lib/atoms/Label.svelte';
    import Textarea from '$lib/atoms/InputTextarea.svelte';

    export let id: string;
    export let label: string;
    export let value: string = '';
    export let hidden: boolean = false;
    export let defaultValues: any = undefined;

    const dispatch = createEventDispatcher();

    // Initialize with default value if provided
    $: {
        if (defaultValues && !value) {
            value = defaultValues;
        }
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        value = target.value;
        dispatch('change', value);
    }
</script>

<div class="w-full {hidden ? 'hidden' : ''}">
    <div class="flex flex-col">
        <textarea
            {id}
            bind:value
            on:input={handleInput}
            class="w-full p-2 border-none min-h-[100px] rounded-md focus:outline-none focus:ring-0 resize-none"
        ></textarea> 
    </div>
</div>
