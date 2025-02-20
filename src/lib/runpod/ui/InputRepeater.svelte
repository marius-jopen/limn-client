<script lang="ts">
    import Textarea from '$lib/runpod/ui/inputs/TextareaUi.svelte';
    import Number from '$lib/runpod/ui/inputs/NumberUi.svelte';
    import Dropdown from '$lib/runpod/ui/inputs/DropdownUi.svelte';

    type BaseField = {
        id: string;
        label: string;
        hidden?: boolean;
    };

    type StringField = BaseField & {
        type: 'string';
    };

    type IntField = BaseField & {
        type: 'int';
    };

    type SelectField = BaseField & {
        type: 'select';
        options: Array<{ label: string; value: string | number }>;
    };

    type UIField = StringField | IntField | SelectField;

    export let UI: UIField[] = [];
    export let values: Record<string, string | number> = {};
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
