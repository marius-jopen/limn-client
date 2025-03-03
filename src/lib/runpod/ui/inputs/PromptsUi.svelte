<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';

    export let id: string;
    export let label: string;
    export let value: string = '{}';

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

<div class="prompts-ui bg-red-200">
    <label for={id}>{label}</label>
    
    <div class="entries">
        {#each entries as entry, index}
            <div class="entry">
                <div class="frame-input">
                    <label>Frame</label>
                    <input 
                        type="number"
                        value={entry.frame}
                        min="0"
                        on:input={(e) => handleInputFrame(e, index)}
                    />
                </div>
                
                <div class="prompt-input">
                    <label>Prompt</label>
                    <textarea
                        rows="3"
                        value={entry.prompt}
                        on:input={(e) => handleInputPrompt(e, index)}
                    ></textarea>
                </div>
                
                <div class="negative-prompt-input">
                    <label>Negative Prompt</label>
                    <textarea
                        rows="3"
                        value={entry.negativePrompt}
                        on:input={(e) => handleInputNegativePrompt(e, index)}
                    ></textarea>
                </div>
                
                <button 
                    class="remove-button"
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

<style>
    .prompts-ui {
        margin-bottom: 1.5rem;
        width: 100%;
    }
    
    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .entries {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .entry {
        display: grid;
        grid-template-columns: 80px 1fr 1fr 40px;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background-color: #f8fafc;
    }
    
    .frame-input input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
    }
    
    .prompt-input, .negative-prompt-input {
        display: flex;
        flex-direction: column;
    }
    
    textarea {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-family: inherit;
        resize: vertical;
    }
    
    .remove-button {
        height: 2rem;
        width: 2rem;
        border-radius: 50%;
        background-color: #f87171;
        color: white;
        font-size: 1.25rem;
        line-height: 1;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: center;
    }
    
    .remove-button:disabled {
        background-color: #d1d5db;
        cursor: not-allowed;
    }
</style>
