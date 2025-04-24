<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';
    import PromptsUi from '$lib/runpod/studio/wabi/inputs/PromptsUi.svelte';
    import LogViewer from '$lib/runpod/studio/wabi/components/LogViewer.svelte';
    import OpenaiRun from '$lib/openai/api/Openai-run.svelte';

    // Define types similar to InputRepeater
    type BaseField = {
        id: string;
        label: string;
        hidden?: boolean;
        default?: any;
        placeholder?: string;
        prefix?: string;
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
    export let onGenerate: () => void = () => {};
    export let isGenerating: boolean = false;
    export let includeButton: boolean = true;

    const defaultSpecificDetails = `Start by identifying the emotional or functional core of the app — what does it really help the user do or feel?
From there, suggest 1 physical object idea that symbolize this essence. These should be simple, iconic objects (e.g., a feather, stopwatch, recipe card) that could stand alone and still evoke the app's meaning.
The object should not depict the app's UI. Instead, it should be something you'd recognize on a table — tangible, metaphorical, slightly poetic, and ideally recognizable in silhouette.
Prioritize clarity, specificity, and emotional resonance. The object can be slightly unexpected or whimsical, but must still be symbolic and deeply tied to the app's purpose.
When ready, I'll use the object as the basis for an icon or illustration.

The result you give us in the end is the prompt which we will then feed into Stable Diffusion to create the image
You only give us the prompt for the image. nothing else`;

    let specificDetails = defaultSpecificDetails;
    let appContext = '';
    let styleType = 'A hyper-detailed, hand-drawn illustration in colored pencil style, Centered, 1:1, tight linework and soft shading';
    let isGeneratingPrompt = false;
    let openaiError = '';
    let lastOpenaiResponse = '';
    let openaiTrigger = 0;
    let showAdvancedSettings = false;

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

    // Handle changes from PromptsUi
    function handlePromptChange(event: CustomEvent) {
        const field = getField('userPrompt');
        if (field?.prefix) {
            values['userPrompt'] = `${field.prefix} ${event.detail}`;
        } else {
            values['userPrompt'] = event.detail;
        }
    }

    // Handle OpenAI response
    function handleOpenaiResponse(event: CustomEvent) {
        lastOpenaiResponse = event.detail;
        isGeneratingPrompt = false;
    }

    // Handle OpenAI error
    function handleOpenaiError(event: CustomEvent) {
        openaiError = event.detail;
        isGeneratingPrompt = false;
    }

    // Reactive statement to update the prompt
    $: if (lastOpenaiResponse) {
        values['userPrompt'] = `${styleType}, ${lastOpenaiResponse}`;
    }

    // Get the combined prompt for OpenAI
    $: combinedPrompt = appContext && specificDetails 
        ? `App Context: ${appContext}\n\nSpecific Details: ${specificDetails}`
        : '';

    function generatePrompt() {
        if (!combinedPrompt) return;
        
        isGeneratingPrompt = true;
        openaiError = '';
        openaiTrigger++;
    }
</script>

<div class="input-controller pt-8 pb-16 px-3">
    <div class="bg-white p-3 rounded-lg max-w-[900px] mx-auto mt-4 md:mt-8">
        <textarea
            id="appContext"
            bind:value={appContext}
            placeholder="Enter the idea of the app"
            class="w-full p-2 rounded-md border-none outline-none focus:outline-none focus:border-none"
            rows="3"
        />
    </div>

    <div class="bg-white p-3 rounded-lg md:rounded-full md:w-fit mx-auto mt-4 flex flex-col-reverse md:flex-row gap-2 justify-center">
        <Button 
            onClick={() => showAdvancedSettings = !showAdvancedSettings}
            variant="secondary"
            size="sm"
            label={showAdvancedSettings ? "Hide Advanced Settings" : "Advanced Settings"}
        />
        <OpenaiRun
            prompt={combinedPrompt}
            bind:isLoading={isGeneratingPrompt}
            on:response={handleOpenaiResponse}
            on:error={handleOpenaiError}
            hideTextarea={true}
            buttonLabel="Generate Prompt"
        />
    </div>

    {#if showAdvancedSettings}
        <div class="bg-white p-3 rounded-lg max-w-[900px] mx-auto mt-4 md:mt-8">
            <textarea
                id="specificDetails"
                bind:value={specificDetails}
                placeholder="Enter the description/assignment"
                class="mb-2 w-full p-3 border font-mono text-sm bg-gray-50 text-gray-600 rounded-md border-gray-300"
                rows="16"
            />

            <textarea
                id="styleType"
                bind:value={styleType}
                placeholder="e.g., illustration, icon, logo"
                class="w-full p-3 border font-mono text-sm bg-gray-50 text-gray-600 rounded-md border-gray-300"
                rows="4"
            />
        </div>
    {/if}

    <div class="bg-white p-3 rounded-lg max-w-[900px] mx-auto mt-4 md:mt-4">
        <PromptsUi
            id="userPrompt"
            label={getField('userPrompt')?.label || 'Generated Prompt'}
            bind:value={values['userPrompt']}
        />

        <!-- Seed Input (hidden) -->
        <div class="hidden">
            <RandomNumberUi
                id="seed"
                label={getField('seed')?.label || 'Seed'}
                bind:value={values['seed']}
                hidden={true}
            />
        </div>
    </div>

    <div class="bg-white p-3 rounded-lg md:rounded-full md:w-fit mx-auto mt-4 flex flex-col-reverse md:flex-row gap-2 justify-center">
        <LogViewer id="log-viewer" label="Generation Logs" />

        <div class="flex flex-row gap-2 md:gap-2 justify-center sm:justify-start mb-1 md:mb-0">
            <Button 
                onClick={onGenerate} 
                disabled={isGenerating}
                variant="primary"
                classes="text-sm"
            >
                🚀 Generate Icon
            </Button>
        </div>
    </div>

    {#if openaiError}
        <div class="error-message text-red-500 text-center mt-2">
            {openaiError}
        </div>
    {/if}
</div>

<style>
    textarea:focus {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
    }
</style>