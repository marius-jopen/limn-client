<script lang="ts">
    import { afterUpdate } from 'svelte';
    import Label from '$lib/atoms/Label.svelte';
    
    export let id: string = '';
    export let label: string = '';
    export let data: Record<string, any> | null | undefined;

    let jsonContainer: HTMLPreElement; // Reference to the pre element

    // Auto-scroll to bottom whenever data updates
    afterUpdate(() => {
        if (jsonContainer) {
            jsonContainer.scrollTop = jsonContainer.scrollHeight;
        }
    });
</script>

{#if data}
    <div class="w-full mt-4">
        <Label for_id={id} {label} />

        <pre
            bind:this={jsonContainer}
            class="m-0 bg-neutral-100 whitespace-pre-wrap break-words border border-gray-200 p-4 text-sm overflow-y-auto h-60"
        >
            {JSON.stringify(data, null, 2)}
        </pre>
    </div> 
{/if}