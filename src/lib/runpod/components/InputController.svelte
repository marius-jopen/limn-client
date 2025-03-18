<script lang="ts">
    import { onMount } from 'svelte';
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

    // Define types similar to InputRepeater
    type BaseField = {
        id: string;
        label: string;
        hidden?: boolean;
        default?: any;
    };

    type Field = BaseField & {
        type: string;
        options?: Array<{ label: string; value: string }>;
        min?: number;
        max?: number;
    };

    // Props: UI config and values binding
    export let UI: Field[] = [];
    export let values: Record<string, any> = {};

    // Initialize values from UI config on mount
    onMount(() => {
        UI.forEach(field => {
            if (values[field.id] === undefined && field.default !== undefined) {
                values[field.id] = field.default;
            }
        });
    });

    // Helper function to find a field by ID
    function getField(id: string): Field | undefined {
        return UI.find(field => field.id === id);
    }

    // Get user ID for upload components
    $: user_id = $user?.id;
</script>

<div class="input-controller">
    <!-- Width and Height in a single row -->
    <div class="grid grid-cols-2 gap-4 mb-4">
        {#if getField('w')}
            <div>
                <Number 
                    id="w"
                    label={getField('w')?.label || 'Width'}
                    bind:value={values['w']}
                />
            </div>
        {/if}
        
        {#if getField('h')}
            <div>
                <Number
                    id="h"
                    label={getField('h')?.label || 'Height'}
                    bind:value={values['h']}
                />
            </div>
        {/if}
    </div>

    <!-- Seed and Steps in a single row -->
    <div class="grid grid-cols-2 gap-4 mb-4">
        {#if getField('seed')}
            <div>
                <Number
                    id="seed"
                    label={getField('seed')?.label || 'Seed'}
                    bind:value={values['seed']}
                />
            </div>
        {/if}
        
        {#if getField('steps')}
            <div>
                <Number
                    id="steps"
                    label={getField('steps')?.label || 'Steps'}
                    bind:value={values['steps']}
                />
            </div>
        {/if}
    </div>

    <!-- Max Frames and Diffusion Cadence in a single row -->
    <div class="grid grid-cols-2 gap-4 mb-4">
        {#if getField('max_frames')}
            <div>
                <Number
                    id="max_frames"
                    label={getField('max_frames')?.label || 'Max Frames'}
                    bind:value={values['max_frames']}
                />
            </div>
        {/if}
        
        {#if getField('diffusion_cadence')}
            <div>
                <Number
                    id="diffusion_cadence"
                    label={getField('diffusion_cadence')?.label || 'Diffusion Cadence'}
                    bind:value={values['diffusion_cadence']}
                />
            </div>
        {/if}
    </div>

    <!-- Init Image (full width) -->
    {#if getField('init_image')}
        <div class="mb-4">
            <UploadImageUi
                id="init_image"
                label={getField('init_image')?.label || 'Init Image'}
                bind:value={values['init_image']}
                userId={user_id}
            />
        </div>
    {/if}

    <!-- Animation Prompts (full width) -->
    {#if getField('prompts')}
        <div class="mb-4">
            <PromptsUi
                id="prompts"
                label={getField('prompts')?.label || 'Animation Prompts'}
                bind:value={values['prompts']}
            />
        </div>
    {/if}

    <!-- Uncomment for debugging -->
    <!-- <details class="mt-4 p-2 bg-gray-50 border rounded">
        <summary class="font-semibold">Debug Info</summary>
        <div class="text-xs mt-2">
            <pre class="bg-gray-100 p-2 rounded">{JSON.stringify(values, null, 2)}</pre>
        </div>
    </details> -->
</div>

<style>
    .input-controller {
        width: 100%;
    }
</style>
