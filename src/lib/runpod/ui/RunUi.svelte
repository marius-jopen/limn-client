<script>
    import Textarea from './inputs/Textarea.svelte';
    import Number from './inputs/Number.svelte';
    import Dropdown from './inputs/Dropdown.svelte';

    export let UI = [];
    export let values = {};
</script>

<div>    
    {#each UI as field}
        {#if field.type === 'string'}
            {#if !field.hidden}
                <Textarea
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {/if}
        {:else if field.type === 'int'}
            {#if !field.hidden}
                <Number
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
