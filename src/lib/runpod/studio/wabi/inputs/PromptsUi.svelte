<script lang="ts">
    import { createEventDispatcher } from 'svelte';

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
        console.log('User input:', value);
        dispatch('change', value);
    }
</script>

<div class="w-full {hidden ? 'hidden' : ''}">
    <div class="flex flex-col">
        <textarea
            {id}
            bind:value
            on:input={handleInput}
            rows="4"
            class="w-full p-3 border font-mono text-sm bg-gray-50 text-gray-600 rounded-md border-gray-300"
        ></textarea> 
    </div>
</div>
