<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Textarea from '$lib/runpod/studio/basic/inputs/TextareaUi.svelte';
    import Number from '$lib/runpod/studio/basic/inputs/NumberUi.svelte';
    import Dropdown from '$lib/runpod/studio/basic/inputs/DropdownUi.svelte';
    import SliderUi from '$lib/runpod/studio/basic/inputs/SliderUi.svelte';
    import BooleanUi from '$lib/runpod/studio/basic/inputs/BooleanUi.svelte';
    // import UploadImageUi from '$lib/runpod/studio/basic/inputs/UploadImageUi.svelte';
    import InitImageUi from '$lib/runpod/studio/basic/inputs/InitImage.svelte';
    import PromptsUi from '$lib/runpod/studio/basic/inputs/PromptsUi.svelte';
    import PromptsSimpleUi from '$lib/runpod/studio/basic/inputs/PromptsSimpleUi.svelte';
    import FormatUi from '$lib/runpod/studio/basic/inputs/FormatUi.svelte';
    import FormatSelectUi from '$lib/runpod/studio/basic/inputs/FormatSelectUi.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';

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

    type FormatField = BaseField & {
        type: 'format';
    };

    type FormatSelectField = BaseField & {
        type: 'format-select';
    };

    type RandomNumberField = BaseField & {
        type: 'random-number';
        hidden?: boolean;
    };

    type UIField = StringField | IntField | SelectField | SliderField | BooleanField | UploadImageField | PromptsField | FormatField | FormatSelectField | RandomNumberField;

    export let UI: UIField[] = [];
    export let values: Record<string, string | number | boolean> = {};

    $: user_id = $user?.id;
</script>

<div>    
    {#each UI as field}
        {#if field.type === 'string'}
            <Textarea
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        {:else if field.type === 'int'}
            <Number
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        {:else if field.type === 'select'}
            <Dropdown
                id={field.id}
                label={field.label}
                options={field.options}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        {:else if field.type === 'slider'}
            <SliderUi
                id={field.id}
                label={field.label}
                min={field.min}
                max={field.max}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        {:else if field.type === 'boolean'}
            <BooleanUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        <!-- {:else if field.type === 'upload-image'}
            <UploadImageUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                userId={user_id}
                hidden={field.hidden}
            /> -->
        {:else if field.type === 'init-image'}
            <InitImageUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                userId={user_id}
                hidden={field.hidden}   
            />
        {:else if field.type === 'prompts'}
            <PromptsUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}   
            />
        {:else if field.type === 'prompts-simple'}
            <PromptsSimpleUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}   
            />
        {:else if field.type === 'random-number'}
            <RandomNumberUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                hidden={field.hidden}
            />
        {:else if field.type === 'format'}
            <FormatUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                placeholder={field.placeholder}
                on:change={(e) => {
                    values[field.id] = e.detail.value;
                    console.log(`InputRepeater: Format field ${field.id} changed to ${values[field.id]}`);
                }}
                hidden={field.hidden}
            />
        {:else if field.type === 'format-select'}
            <FormatSelectUi
                id={field.id}
                label={field.label}
                bind:value={values[field.id]}
                placeholder={field.placeholder}
                on:change={(e) => {
                    values[field.id] = e.detail.value;
                    console.log(`InputRepeater: Format field ${field.id} changed to ${values[field.id]}`);
                }}
                hidden={field.hidden}
            />
        {/if}
    {/each}
</div>
