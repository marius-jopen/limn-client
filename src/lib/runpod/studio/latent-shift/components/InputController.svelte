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
    import LogViewer from '$lib/runpod/studio/latent-shift/components/LogViewer.svelte';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import { runState } from '$lib/runpod/helper/StoreRun.js';

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

    async function handleCancel(event) {
        console.log("Cancel handler triggered with event:", event);
        
        // Get current batch from runState or find most recent batch
        let currentBatch = $runState?.batchName;
        
        if (!currentBatch) {
            // Get the most recent batch from the lineage paths
            const { data: batches, error: batchError } = await supabase
                .from('resource')
                .select('batch_name, created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (batches && batches.length > 0) {
                currentBatch = batches[0].batch_name;
            }
        }
        
        console.log("Using batch:", currentBatch);
        
        if (!currentBatch) {
            console.log("No batch found");
            return;
        }

        try {
            // Query for the latest image in this batch
            const { data: latestImage, error } = await supabase
                .from('resource')
                .select('id, image_url')
                .eq('batch_name', currentBatch)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            if (!latestImage) {
                console.log("No images found in batch");
                return;
            }

            console.log("Found latest image:", latestImage);
            
            // Update both the selectedImageId and init_image value
            await selectedImageId.set(latestImage.id, { preserve_lineage: true });
            values = {
                ...values,
                init_image: latestImage.image_url
            };
            
            console.log("Updated values:", values);
        } catch (err) {
            console.error('Error in handleCancel:', err);
        }
    }
</script>

<div class="input-controller pt-8 pb-16 px-3">
    <InitImage
        id="init_image"
        label={getField('init_image')?.label || 'Init Image'}
        bind:value={values['init_image']}
        userId={user_id}
        info={getField('init_image')?.info}
        on:hover={({ detail }) => handleHover(detail.isHovering, 'init_image', undefined, detail.info || "Status")}
    />

    <CameraUi
        id="camera"
        label={getField('camera')?.label || 'Camera'}
        bind:value={values['camera']}
        bind:this={cameraComponent}
        info={getField('camera')?.info}
    />

    <div class="bg-white p-3 rounded-lg max-w-[900px] mx-auto mt-8 ">
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

                <div
                    on:mouseenter={() => handleHover(true, 'cfg_scale_schedule')}
                    on:mouseleave={() => handleHover(false, 'cfg_scale_schedule')}
                >
                    <IntDropdown
                        id="cfg_scale_schedule"
                        options={getField('cfg_scale_schedule')?.options}
                        bind:value={values['cfg_scale_schedule']}
                        hidden={getField('cfg_scale_schedule')?.hidden}
                        prefix={getField('cfg_scale_schedule')?.display?.prefix || ''}
                        suffix={getField('cfg_scale_schedule')?.display?.suffix || ''}
                    />
                </div>

                <div
                    on:mouseenter={() => handleHover(true, 'strenght_schedule')}
                    on:mouseleave={() => handleHover(false, 'strenght_schedule')}
                >
                    <IntDropdown
                        id="strenght_schedule"
                        options={getField('strenght_schedule')?.options}
                        bind:value={values['strenght_schedule']}
                        hidden={getField('strenght_schedule')?.hidden}
                        prefix={getField('strenght_schedule')?.display?.prefix || ''}
                        suffix={getField('strenght_schedule')?.display?.suffix || ''}
                    />
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
                            <span class="md:hidden">{promptMode === 'clean' ? '🌸' : '✊'}</span>
                            <span class="hidden md:block">{promptMode === 'clean' ? '🌸 Fine' : '✊ Raw'}</span>
                        </Button>
                    </div>
                    <div slot="content">
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="🌸 Fine"
                            onClick={() => {
                                promptMode = 'clean';
                                document.body.click();
                            }}
                            classes={`w-full justify-start ${promptMode === 'clean' ? 'bg-gray-300' : ''}`}
                        />
                        <Button 
                            variant="ghost"
                            size="sm"
                            label="✊ Raw"
                            onClick={() => {
                                promptMode = 'original';
                                document.body.click();
                            }}
                            classes={`w-full justify-start ${promptMode === 'original' ? 'bg-gray-300' : ''}`}
                        />
                    </div>
                </Dropdown>
            </div>
        </div>
    </div>

    <div class="bg-white p-3 rounded-lg w-fit mx-auto mt-4 flex flex-row gap-2 justify-center">
        <LogViewer id="log-viewer" label="Generation Logs" />

        <div
            class="block"
            on:mouseenter={() => handleHover(true, 'cancel', undefined, BUTTON_INFO.cancel)}
            on:mouseleave={() => handleHover(false, 'cancel')}
        >
            <Cancel 
                on:cancel={handleCancel}
            />   
        </div>

        <div
            class="block"
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

    <div class="flex justify-cente mt-12 md:mt-4 block relative  mb-4 md:mb-0">
      
        

        <div 
        class="hidden md:block pt-[6px] w-full text-center bg-gray-100 text-sm text-gray-500 px-4 z-20 relative transition-all duration-200 ease-in-out text-center"
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