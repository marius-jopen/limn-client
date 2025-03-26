<script lang="ts">
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import Number from '$lib/runpod/studio/basic/inputs/NumberUi.svelte';
    import InitImage from '$lib/runpod/studio/latent-shift/inputs/InitImage.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';
    import PromptsUi from '$lib/runpod/studio/latent-shift/inputs/PromptsUi.svelte';
    import IntDropdown from '$lib/runpod/studio/basic/inputs/IntDropdownUi.svelte';   
    import CameraUi from '$lib/runpod/studio/latent-shift/inputs/CameraUi.svelte';
    import Dropdown from '$lib/atoms/Dropdown.svelte';

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

    // Add this variable to store the references
    let loraComponent: { openLoraOverlay: () => void };
    let cameraComponent: { isOverlayOpen: boolean };

    // Add prompt mode state
    let promptMode: 'clean' | 'original' = 'clean';

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

<div class="input-controller pt-8 pb-16 px-3">
   <InitImage
        id="init_image"
        label={getField('init_image')?.label || 'Init Image'}
        bind:value={values['init_image']}
        userId={user_id}
    />

    <CameraUi
        id="camera"
        label={getField('camera')?.label || 'Camera'}
        bind:value={values['camera']}
        bind:this={cameraComponent}
    />

    <div class="bg-white p-3 rounded-lg max-w-[800px] mx-auto mt-8 ">
        <PromptsUi
            id="prompts"
            label={getField('prompts')?.label || 'Animation Prompts'}
            bind:value={values['prompts']}
            options={getField('prompts')?.options}
            bind:this={loraComponent}
            defaultValues={getField('prompts')?.default}
            bind:promptMode={promptMode}
        />
    
        <div class="flex flex-row gap-2 justify-between mt-1">
            <div class="flex flex-row gap-2">
                <IntDropdown
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
                    variant="quaternary"
                    classes="text-sm"
                />

                <Button 
                    onClick={() => cameraComponent?.openOverlay()} 
                    label="🎥 Camera"
                    variant="quaternary"
                    classes="text-sm"
                />

                <Dropdown position="top" >
                    <div slot="trigger">
                        <Button 
                            variant="quaternary"
                            size="sm"
                            label={promptMode === 'clean' ? '💦 Clean' : '🪨 Original'}
                        />
                    </div>
                    <div slot="content">
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="Clean"
                            onClick={() => {
                                promptMode = 'clean';
                                document.body.click(); // This will close the dropdown
                            }}
                            classes={`w-full justify-start ${promptMode === 'clean' ? 'bg-gray-300' : ''}`}
                        />
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="Original"
                            onClick={() => {
                                promptMode = 'original';
                                document.body.click(); // This will close the dropdown
                            }}
                            classes={`w-full justify-start ${promptMode === 'original' ? 'bg-gray-300' : ''}`}
                        />
                    </div>
                </Dropdown>
            </div>

            <div class="flex flex-row gap-2">
                <Cancel />   
        
                <Button 
                    onClick={onGenerate} 
                    label="💥 Generate" 
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