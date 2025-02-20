<script>
    import InputPrompt from './InputPrompt.svelte';
    import InputNumber from './InputNumber.svelte';

    // Props
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
        <div class="flex flex-col gap-2">
            <label for={field.id} class="text-sm font-medium text-gray-700">{field.label}</label>
            <select
                id={field.id}
                bind:value={values[field.id]}
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                {#each field.options as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>
    {/if}
{/each}
