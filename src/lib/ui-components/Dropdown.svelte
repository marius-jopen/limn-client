<script>
    import Label from '../atoms/Label.svelte';
    
    export let id = "";
    export let value = "";
    export let options = [];
    export let label = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />

    <select
        {id}
        bind:value
        class="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    >
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
</div>
