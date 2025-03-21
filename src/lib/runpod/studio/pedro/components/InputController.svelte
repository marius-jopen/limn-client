<script lang="ts">
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import Number from '$lib/runpod/studio/basic/inputs/NumberUi.svelte';
    import InitImage from '$lib/runpod/studio/latent-shift/inputs/InitImage.svelte';
    import PromptsSimpleUi from '$lib/runpod/studio/basic/inputs/PromptsSimpleUi.svelte';
    import FormatSelectUi from '$lib/runpod/studio/basic/inputs/FormatSelectUi.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';
    import PromptsUi from '$lib/runpod/studio/basic/inputs/PromptsUi.svelte';
    // Define types similar to InputRepeater
    type BaseField = {
        id: string;
        label: string;
        hidden?: boolean;
        default?: any;
        placeholder?: string;
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
    // Add props for the Generate button
    export let onGenerate: () => void = () => {}; // Default to empty function
    export let isGenerating: boolean = false;
    export let includeButton: boolean = true; // Allow toggling the button

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

<div class="input-controller pt-24 pb-28">

    PEDROS CONTROLLER
   <!-- Init Image (full width) -->
   {#if getField('init_image')}
        <div class="mb-12">
            <InitImage
                id="init_image"
                label={getField('init_image')?.label || 'Init Image'}
                bind:value={values['init_image']}
                userId={user_id}
            />
        </div>
    {/if}

    <div class="bg-gray-200 p-4 rounded-md w-8/12 mx-auto">
        <!-- Format (Width and Height) field if available -->
        {#if getField('format')}
            <div class="mb-4">
                <FormatSelectUi
                    id="format"
                    label={getField('format')?.label || 'Width, Height'}
                    bind:value={values['format']}
                    placeholder={getField('format')?.placeholder || '${W}, ${H}'}
                    on:change={(e) => {
                        values['format'] = e.detail.value;
                        console.log(`InputController: Format field changed to ${values['format']}`);
                    }}
                />
            </div>
        {/if}
      
        <!-- Seed and Steps in a single row -->
        <div class="grid grid-cols-2 gap-4 mb-4">
            {#if getField('random-number')}
                <div>
                    <RandomNumberUi
                        id="random-number"
                        label={getField('random-number')?.label || 'Seed'}
                        bind:value={values['random-number']}
                        hidden={getField('random-number')?.hidden}
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
    
     
    
        <!-- Animation Prompts (full width) -->
        {#if getField('prompts')}
            <div class="mb-4">
                <!-- <PromptsSimpleUi
                    id="prompts"
                    label={getField('prompts')?.label || 'Animation Prompts'}
                    bind:value={values['prompts']}
                /> -->
    
                <PromptsUi
                    id="prompts"
                    label={getField('prompts')?.label || 'Animation Prompts'}
                    bind:value={values['prompts']}
                />
            </div>
        {/if}
    
        <!-- Generate Button (inside the controller) -->
        {#if includeButton}
            <div class="mt-6">
                <Button 
                    onClick={onGenerate} 
                    label="Generate" 
                    disabled={isGenerating}
                />
            </div>
        {/if}
    
        <Cancel />
    
    
        <!-- Uncomment for debugging -->
        <!-- <details class="mt-4 p-2 bg-gray-50 border rounded">
            <summary class="font-semibold">Debug Info</summary>
            <div class="text-xs mt-2">
                <pre class="bg-gray-100 p-2 rounded">{JSON.stringify(values, null, 2)}</pre>
            </div>
        </details> -->
    </div>


</div>

<style>
    .input-controller {
        width: 100%;
    }
</style>
