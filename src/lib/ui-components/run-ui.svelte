<script>
    import InputPrompt from './InputPrompt.svelte';
    import InputNumber from './InputNumber.svelte';
    import Dropdown from './Dropdown.svelte';

    export let UI = [];
    export let values = {};
</script>

{#each UI as field}
    {#if field.type === 'string'}
        <InputPrompt
            id={field.id}
            label={field.label}
            bind:value={values[field.id]}
        />
    {:else if field.type === 'int'}
        <InputNumber
            id={field.id}
            label={field.label}
            bind:value={values[field.id]}
        />
    {:else if field.type === 'select'}
        <Dropdown
            id={field.id}
            label={field.label}
            options={field.options}
            bind:value={values[field.id]}
        />
    {/if}
{/each}
