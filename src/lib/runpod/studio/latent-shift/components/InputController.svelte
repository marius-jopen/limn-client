<script lang="ts">
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
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

    // Add status text and opacity state
    let statusText = "Status";
    let statusOpacity = 0;

    // Add button info texts
    const BUTTON_INFO = {
        cancel: "Pause the image generation, so you can continue the generation with a new image",
        generate: "Generate new images",
        clean: "Enhanced: Adds some enhancements to the prompt | Original: Keeps the prompt as is"
    };

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

    // Helper function to handle hover for any element
    function handleHover(isHovering: boolean, fieldId: string, infoKey?: string, defaultText = "Status") {
        if (isHovering) {
            const field = getField(fieldId);
            if (infoKey && typeof field?.info === 'object') {
                statusText = field.info[infoKey] || defaultText;
            } else {
                statusText = field?.info || defaultText;
            }
            statusOpacity = 1;
        } else {
            statusOpacity = 0;
            setTimeout(() => {
                if (statusOpacity === 0) {
                    statusText = "Status";
                }
            }, 200);
        }
    }
</script>

<div class="input-controller pt-8 pb-16 px-3">
   <div
        on:mouseenter={() => handleHover(true, 'init_image')}
        on:mouseleave={() => handleHover(false, 'init_image')}
    >
        <InitImage
            id="init_image"
            label={getField('init_image')?.label || 'Init Image'}
            bind:value={values['init_image']}
            userId={user_id}
            info={getField('init_image')?.info}
            on:hover={({ detail }) => handleHover(detail.isHovering, 'init_image')}
        />
    </div>

    <CameraUi
        id="camera"
        label={getField('camera')?.label || 'Camera'}
        bind:value={values['camera']}
        bind:this={cameraComponent}
        info={getField('camera')?.info}
    />

    <div class="bg-white p-3 rounded-lg max-w-[800px] mx-auto mt-8 ">
        <div
            on:mouseenter={() => handleHover(true, 'prompts', 'prompts')}
            on:mouseleave={() => handleHover(false, 'prompts')}
        >
            <PromptsUi
                id="prompts"
                label={getField('prompts')?.label || 'Animation Prompts'}
                bind:value={values['prompts']}
                options={getField('prompts')?.options}
                bind:this={loraComponent}
                defaultValues={getField('prompts')?.default}
                bind:promptMode={promptMode}
                info={getField('prompts')?.info}
            />
        </div>
    
        <div class="flex flex-col sm:flex-row gap-1 md:gap-2 justify-between mt-1">
            <div class="flex flex-row gap-1 md:gap-2 justify-center sm:justify-start mb-1 md:mb-0">
                <div
                    on:mouseenter={() => handleHover(true, 'max_frames')}
                    on:mouseleave={() => handleHover(false, 'max_frames')}
                >
                    <IntDropdown
                        id="max_frames"
                        options={getField('max_frames')?.options}
                        bind:value={values['max_frames']}
                        hidden={getField('max_frames')?.hidden}
                        prefix={getField('max_frames')?.display?.prefix || ''}
                        suffix={getField('max_frames')?.display?.suffix || ''}
                    />
                </div>
        
                <div
                    on:mouseenter={() => handleHover(true, 'prompts', 'style')}
                    on:mouseleave={() => handleHover(false, 'prompts')}
                >
                    <Button 
                        onClick={() => loraComponent?.openLoraOverlay()} 
                        variant="quaternary"
                        classes="text-sm"
                    >
                        <span class="md:hidden">💥</span>
                        <span class="hidden md:block">💥 Style</span>
                    </Button>
                </div>

                <div
                    on:mouseenter={() => handleHover(true, 'camera')}
                    on:mouseleave={() => handleHover(false, 'camera')}
                >
                    <Button 
                        onClick={() => cameraComponent?.openOverlay()} 
                        variant="quaternary"
                        classes="text-sm"
                    >
                        <span class="md:hidden">🎥</span>
                        <span class="hidden md:block">🎥 Camera</span>
                    </Button>
                </div>

                <Dropdown position="top">
                    <div 
                        slot="trigger"
                        on:mouseenter={() => handleHover(true, 'prompt_mode', undefined, BUTTON_INFO.clean)}
                        on:mouseleave={() => handleHover(false, 'prompt_mode')}
                    >
                        <Button 
                            variant="quaternary"
                            size="sm"
                            classes=""
                        >
                            <span class="md:hidden">{promptMode === 'clean' ? '🌸' : '🪨'}</span>
                            <span class="hidden md:block">{promptMode === 'clean' ? '🌸 Enhanced' : '🪨 Original'}</span>
                        </Button>
                    </div>
                    <div slot="content">
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="Clean"
                            onClick={() => {
                                promptMode = 'clean';
                                document.body.click();
                            }}
                            classes={`w-full justify-start ${promptMode === 'clean' ? 'bg-gray-300' : ''}`}
                        />
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="Original"
                            onClick={() => {
                                promptMode = 'original';
                                document.body.click();
                            }}
                            classes={`w-full justify-start ${promptMode === 'original' ? 'bg-gray-300' : ''}`}
                        />
                    </div>
                </Dropdown>
            </div>

            <div class="flex flex-row gap-1 md:gap-2 justify-center sm:justify-start">
                <div
                    on:mouseenter={() => handleHover(true, 'cancel', undefined, BUTTON_INFO.cancel)}
                    on:mouseleave={() => handleHover(false, 'cancel')}
                >
                    <Cancel />   
                </div>
        
                <div
                    on:mouseenter={() => handleHover(true, 'generate', undefined, BUTTON_INFO.generate)}
                    on:mouseleave={() => handleHover(false, 'generate')}
                >
                    <Button 
                        onClick={onGenerate} 
                        disabled={isGenerating}
                        variant="primary"
                        classes="text-sm"
                    >
                        💥 Generate
                    </Button>    
                </div>
            </div>
        </div>
    </div>

    <div class="flex justify-center mt-4">
        <div 
            class="p-2 text-sm text-gray-500 px-4 transition-all duration-200 ease-in-out"
            style="opacity: {statusOpacity}"
        >
            {statusText}
        </div>
    </div>
</div>

<RandomNumberUi
    id="random-number"
    label={getField('random-number')?.label || 'Seed'}
    bind:value={values['random-number']}
    hidden={getField('random-number')?.hidden}
/>