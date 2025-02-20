<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    
    export let id: string = '';
    export let label: string = '';
    export let data: Record<string, any> | null | undefined;
</script>

{#if data}
    <div class="flex flex-col gap-1">
        <Label for_id={id} {label} />

        <pre class="m-0 bg-neutral-100 whitespace-pre-wrap break-words border border-gray-200 p-4 text-sm">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div> 
{/if}