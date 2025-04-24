<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import RandomNumberUi from '$lib/runpod/studio/basic/inputs/RandomNumberUi.svelte';
    import PromptsUi from '$lib/runpod/studio/wabi/inputs/PromptsUi.svelte';
    import IntDropdown from '$lib/runpod/studio/basic/inputs/IntDropdownUi.svelte';
    import LogViewer from '$lib/runpod/studio/wabi/components/LogViewer.svelte';

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

<div class="input-controller pt-8 pb-16 px-3">
    <div class="bg-white p-3 rounded-lg max-w-[900px] mx-auto mt-4 md:mt-8">
        <!-- Prompt Input -->
        <div class="mb-4">
            <PromptsUi
                id="userPrompt"
                label={getField('userPrompt')?.label || 'Prompt'}
                bind:value={values['userPrompt']}
            />
        </div>

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
                🚀 Generate
            </Button>
        </div>
    </div>
</div>