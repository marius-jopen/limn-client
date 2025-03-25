<script lang="ts">
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import Number from '$lib/runpod/studio/basic/inputs/NumberUi.svelte';
    import InitImage from '$lib/runpod/studio/latent-shift/inputs/InitImage.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';
    import PromptsUi from '$lib/runpod/studio/latent-shift/inputs/PromptsUi.svelte';
    import Dropdown from '$lib/runpod/studio/basic/inputs/DropdownUi.svelte';   

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

    <div class="bg-gray-100 p-4 rounded-md w-8/12 mx-auto">
     
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
                    options={getField('prompts')?.options}
                />
            </div>
        {/if}
    
        <!-- Max Frames and Diffusion Cadence in a single row -->
        <div class="grid grid-cols-2 gap-4 mb-4">
            {#if getField('max_frames')}
                <div>
                    <!-- <Number
                        id="max_frames"
                        label={getField('max_frames')?.label || 'Max Frames'}
                        bind:value={values['max_frames']}
                    /> -->

                    <Dropdown
                        id="max_frames"
                        label={getField('max_frames')?.label || 'Max Frames'}
                        options={getField('max_frames')?.options}
                        bind:value={values['max_frames']}
                        hidden={getField('max_frames')?.hidden}
                    />
                </div>
            {/if}
        </div>
    
     
    
    
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
