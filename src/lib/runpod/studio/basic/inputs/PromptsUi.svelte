<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';

    export let id: string;
    export let label: string;
    export let value: string = '{}';
    export let hidden: boolean = false;

    const dispatch = createEventDispatcher();

    // Parse the initial value or start with an empty object
    let prompts: { [frame: string]: string } = {};
    try {
        if (value && value !== '{}') {
            prompts = JSON.parse(value);
        }
    } catch (e) {
        console.error('Error parsing prompts value:', e);
    }

    // Maintain a list of keyframe entries
    let entries: { frame: string; prompt: string; negativePrompt: string }[] = [];

    // Initialize entries from prompts object
    function initializeEntries() {
        entries = [];
        Object.entries(prompts).forEach(([frame, promptValue]) => {
            const parts = promptValue.split('--neg');
            const prompt = parts[0]?.trim() || '';
            const negativePrompt = parts[1]?.trim() || '';
            entries.push({ frame, prompt, negativePrompt });
        });

        // Add an empty entry if there are none
        if (entries.length === 0) {
            addEntry();
        }
    }

    // Initialize on component mount
    initializeEntries();

    // Add a new entry
    function addEntry() {
        // Find the next available frame number
        const maxFrame = entries.length > 0 
            ? Math.max(...entries.map(e => parseInt(e.frame) || 0)) 
            : -1;
        const nextFrame = (maxFrame + 5).toString();
        entries = [...entries, { frame: nextFrame, prompt: '', negativePrompt: '' }];
        updateValue();
    }

    // Remove an entry
    function removeEntry(index: number) {
        entries = entries.filter((_, i) => i !== index);
        updateValue();
    }

    // Update the value when entries change
    function updateValue() {
        prompts = {};
        entries.sort((a, b) => (parseInt(a.frame) || 0) - (parseInt(b.frame) || 0))
              .forEach(entry => {
                  if (entry.frame && (entry.prompt || entry.negativePrompt)) {
                      prompts[entry.frame] = `${entry.prompt} --neg ${entry.negativePrompt}`;
                  }
              });
        value = JSON.stringify(prompts);
        dispatch('change', value);
    }

    // Handlers for input changes
    function updateFrame(index: number, newFrame: string) {
        entries[index].frame = newFrame;
        updateValue();
    }

    function updatePrompt(index: number, newPrompt: string) {
        entries[index].prompt = newPrompt;
        updateValue();
    }

    function updateNegativePrompt(index: number, newNegPrompt: string) {
        entries[index].negativePrompt = newNegPrompt;
        updateValue();
    }

    function handleInputFrame(event: Event, index: number) {
        const target = event.target as HTMLInputElement;
        updateFrame(index, target.value);
    }

    function handleInputPrompt(event: Event, index: number) {
        const target = event.target as HTMLTextAreaElement;
        updatePrompt(index, target.value);
    }

    function handleInputNegativePrompt(event: Event, index: number) {
        const target = event.target as HTMLTextAreaElement;
        updateNegativePrompt(index, target.value);
    }
</script>

<div class="mb-6 w-full {hidden ? 'hidden' : ''}">
    <label for={id} class="block font-semibold mb-2">{label}</label>
    
    <div class="flex flex-col gap-4 mb-4">
        {#each entries as entry, index}
            <div class="grid grid-cols-[80px_1fr_1fr_40px] gap-4 p-4 border border-gray-200 bg-gray-50">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Frame</label>
                    <input 
                        type="number"
                        value={entry.frame}
                        min="0"
                        on:input={(e) => handleInputFrame(e, index)}
                        class="w-full py-2 px-3 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div class="flex flex-col">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                    <textarea
                        rows="3"
                        value={entry.prompt}
                        on:input={(e) => handleInputPrompt(e, index)}
                        class="p-2 border border-gray-200 font-inherit resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>
                
                <div class="flex flex-col">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Negative Prompt</label>
                    <textarea
                        rows="3"
                        value={entry.negativePrompt}
                        on:input={(e) => handleInputNegativePrompt(e, index)}
                        class="p-2 border border-gray-200 font-inherit resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>
                
                <button 
                    class="h-8 w-8 bg-red-400 hover:bg-red-500 text-white text-xl border-none cursor-pointer flex items-center justify-center self-center disabled:bg-gray-300 disabled:cursor-not-allowed"
                    on:click={() => removeEntry(index)}
                    disabled={entries.length <= 1}
                >
                    ×
                </button>
            </div>
        {/each}
    </div>
    
    <Button 
        onClick={addEntry} 
        label="Add Keyframe" 
    />
    
    <input type="hidden" {id} {value} />
</div>
