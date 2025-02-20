<script>
    import InputPrompt from '../../ui-components/InputPrompt.svelte';
    import InputNumber from '../../ui-components/InputNumber.svelte';
    import Dropdown from '../../ui-components/Dropdown.svelte';

    export let UI = [];
    export let values = {};
</script>

<div>    
    {#each UI as field}
        {#if field.type === 'string'}
            {#if !field.hidden}
                <InputPrompt
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {/if}
        {:else if field.type === 'int'}
            {#if !field.hidden}
                <InputNumber
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {/if}
        {:else if field.type === 'select'}
            {#if !field.hidden}
                <Dropdown
                    id={field.id}
                    label={field.label}
                    options={field.options}
                    bind:value={values[field.id]}
                />
            {/if}
        {/if}
    {/each}
</div>
