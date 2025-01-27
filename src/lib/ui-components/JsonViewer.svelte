<script>
    import JsonDisplay from '../atomic-components/JsonDisplay.svelte';
    import Label from '../atomic-components/Label.svelte';
    export let id = '';
    export let label = '';
    export let data;
</script>

{#if data}
    <div class="flex flex-col gap-1">
        <Label for_id={id} {label} />
        <JsonDisplay {data} />
    </div> 
{/if}