<script>
    import Label from '../../atoms/Label.svelte';
    
    export let id = '';
    export let label = '';
    export let data;
</script>

{#if data}
    <div class="flex flex-col gap-1">
        <Label for_id={id} {label} />

        <pre class="m-0 bg-neutral-100 whitespace-pre-wrap break-words border border-gray-200 p-4 text-sm">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div> 
{/if}