<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Textarea from '$lib/runpod/inputs/TextareaUi.svelte';
    import Number from '$lib/runpod/inputs/NumberUi.svelte';
    import Dropdown from '$lib/runpod/inputs/DropdownUi.svelte';
    import SliderUi from '$lib/runpod/inputs/SliderUi.svelte';
    import BooleanUi from '$lib/runpod/inputs/BooleanUi.svelte';
    import UploadImageUi from '$lib/runpod/inputs/UploadImageUi.svelte';
    import InitImageUi from '$lib/runpod/inputs/InitImageUi.svelte';
    import PromptsUi from '$lib/runpod/inputs/PromptsUi.svelte';
    import PromptsSimpleUi from '$lib/runpod/inputs/PromptsSimpleUi.svelte';

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
        options: Array<{ label: string; value: string }>;
    };

    type SliderField = BaseField & {
        type: 'slider';
        min: number;
        max: number;
    };

    type BooleanField = BaseField & {
        type: 'boolean';
    };

    type UploadImageField = BaseField & {
        type: 'upload-image';
    };

    type PromptsField = BaseField & {
        type: 'prompts';
    };

    type UIField = StringField | IntField | SelectField | SliderField | BooleanField | UploadImageField | PromptsField;

    export let UI: UIField[] = [];
    export let values: Record<string, string | number | boolean> = {};

    $: user_id = $user?.id;
</script>

<div>    
    {#each UI as field}
        {#if !field.hidden}
            {#if field.type === 'string'}
                <Textarea
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {:else if field.type === 'int'}
                <Number
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
            {:else if field.type === 'slider'}
                <SliderUi
                    id={field.id}
                    label={field.label}
                    min={field.min}
                    max={field.max}
                    bind:value={values[field.id]}
                />
            {:else if field.type === 'boolean'}
                <BooleanUi
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {:else if field.type === 'upload-image'}
                <UploadImageUi
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                    userId={user_id}
                />
            {:else if field.type === 'init-image'}
                <InitImageUi
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                    userId={user_id}
                />
            {:else if field.type === 'prompts'}
                <PromptsUi
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {:else if field.type === 'prompts-simple'}
                <PromptsSimpleUi
                    id={field.id}
                    label={field.label}
                    bind:value={values[field.id]}
                />
            {/if}
        {/if}
    {/each}
</div>
