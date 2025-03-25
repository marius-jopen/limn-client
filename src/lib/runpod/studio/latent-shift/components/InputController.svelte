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
        display?: {
            prefix?: string;
            suffix?: string;
        };
    };

    // Props: UI config and values binding
    export let UI: Field[] = [];
    export let values: Record<string, any> = {};
    // Add props for the Generate button
    export let onGenerate: () => void = () => {}; // Default to empty function
    export let isGenerating: boolean = false;
    export let includeButton: boolean = true; // Allow toggling the button

    // Add this variable to store the reference
    let loraComponent: { openLoraOverlay: () => void };

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

<div class="input-controller pt-8 pb-16 ">
   <InitImage
        id="init_image"
        label={getField('init_image')?.label || 'Init Image'}
        bind:value={values['init_image']}
        userId={user_id}
    />

    <div class="bg-gray-100 p-3 rounded-lg w-8/12 mx-auto mt-8">
        <PromptsUi
            id="prompts"
            label={getField('prompts')?.label || 'Animation Prompts'}
            bind:value={values['prompts']}
            options={getField('prompts')?.options}
            bind:this={loraComponent}
        />
    
        <div class="flex flex-row gap-2 justify-between mt-1">
            <div class="flex flex-row gap-2">
                <Dropdown
                    id="max_frames"
                    options={getField('max_frames')?.options}
                    bind:value={values['max_frames']}
                    hidden={getField('max_frames')?.hidden}
                    prefix={getField('max_frames')?.display?.prefix || ''}
                    suffix={getField('max_frames')?.display?.suffix || ''}
                />
        
                <Button 
                    onClick={() => loraComponent?.openLoraOverlay()} 
                    label="💥 Style"
                    variant="secondary"
                    classes="text-sm"
                />
            </div>

            <div class="flex flex-row gap-2">
                <Cancel />   
        
                <Button 
                    onClick={onGenerate} 
                    label="Generate" 
                    disabled={isGenerating}
                    variant="primary"
                    size="sm"
                />    
            </div>
        </div>
    </div>
</div>

<RandomNumberUi
    id="random-number"
    label={getField('random-number')?.label || 'Seed'}
    bind:value={values['random-number']}
    hidden={getField('random-number')?.hidden}
/>