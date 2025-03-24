<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import Label from '$lib/atoms/Label.svelte';
    import Textarea from '$lib/atoms/InputTextarea.svelte';

    export let id: string;
    export let label: string;
    export let value: string = '{}';
    export let hidden: boolean = false;

    const dispatch = createEventDispatcher();

    // Add all our state variables at the top
    let globalPositivePrompt: string = '';
    let globalNegativePrompt: string = '';
    let hasUserEdits: boolean = false;
    let defaultPrompts: { [frame: string]: string } = {};
    let entries: { frame: string; prompt: string; negativePrompt: string }[] = [];
    let prompts: { [frame: string]: string } = {};

    // Parse the initial value and set defaults
    try {
        if (value) {
            // Handle both string and object values
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            
            // Set global prompts from defaults
            if (parsed.globalPositive) {
                globalPositivePrompt = parsed.globalPositive;
            }
            if (parsed.globalNegative) {
                globalNegativePrompt = parsed.globalNegative;
            }

            // Set frame entries from defaults
            if (parsed.frames) {
                entries = Object.entries(parsed.frames).map(([frame, promptValue]) => {
                    const [prompt, negative] = (promptValue as string).split('--neg').map(p => p.trim());
                    return {
                        frame,
                        prompt: prompt || '',
                        negativePrompt: negative || ''
                    };
                });
            }
        }
    } catch (e) {
        console.error('Error parsing prompts value:', e);
        // Initialize with empty entry if parsing fails
        entries = [{ frame: '0', prompt: '', negativePrompt: '' }];
    }

    // If no entries were created, add an empty one
    if (entries.length === 0) {
        entries = [{ frame: '0', prompt: '', negativePrompt: '' }];
    }

    function initializeEntries() {
        entries = [];
        Object.entries(defaultPrompts).forEach(([frame, _]) => {
            entries.push({ frame, prompt: '', negativePrompt: '' });
        });

        if (entries.length === 0) {
            addEntry();
        }
    }

    function updateValue() {
        console.log('=== updateValue start ===');
        console.log('Global Positive:', globalPositivePrompt);
        console.log('Global Negative:', globalNegativePrompt);
        console.log('Entries:', entries);

        prompts = {};  // Now this will work
        entries.sort((a, b) => (parseInt(a.frame) || 0) - (parseInt(b.frame) || 0))
              .forEach((entry) => {
                  if (entry.frame) {
                      // Build positive prompt with global
                      let positivePrompt = '';
                      if (globalPositivePrompt && entry.prompt) {
                          positivePrompt = `${globalPositivePrompt} ${entry.prompt}`;
                          console.log('Combined positive:', positivePrompt);
                      } else if (globalPositivePrompt) {
                          positivePrompt = globalPositivePrompt;
                      } else {
                          positivePrompt = entry.prompt;
                      }

                      // Build negative prompt with global
                      let negativePrompt = '';
                      if (globalNegativePrompt && entry.negativePrompt) {
                          negativePrompt = `${globalNegativePrompt} ${entry.negativePrompt}`;
                          console.log('Combined negative:', negativePrompt);
                      } else if (globalNegativePrompt) {
                          negativePrompt = globalNegativePrompt;
                      } else {
                          negativePrompt = entry.negativePrompt;
                      }

                      prompts[entry.frame] = `${positivePrompt} --neg ${negativePrompt}`.trim();
                      console.log(`Frame ${entry.frame} final:`, prompts[entry.frame]);
                  }
              });
        
        value = JSON.stringify(prompts);
        console.log('Final value:', value);
        dispatch('change', value);
    }

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

    // Handlers for input changes
    function updateFrame(index: number, newFrame: string) {
        entries[index].frame = newFrame;
        updateValue();
    }

    function handleInputFrame(event: Event, index: number) {
        const target = event.target as HTMLInputElement;
        updateFrame(index, target.value);
    }

    function handleInputPrompt(event: Event, index: number) {
        hasUserEdits = true;
        const target = event.target as HTMLTextAreaElement;
        entries[index].prompt = target.value;
        updateValue();
    }

    function handleInputNegativePrompt(event: Event, index: number) {
        hasUserEdits = true;
        const target = event.target as HTMLTextAreaElement;
        entries[index].negativePrompt = target.value;
        updateValue();
    }

    // Add handlers for global prompts
    function handleGlobalPositivePrompt(event: Event) {
        console.log('Setting global positive:', (event.target as HTMLTextAreaElement).value);
        globalPositivePrompt = (event.target as HTMLTextAreaElement).value;
        updateValue();
    }

    function handleGlobalNegativePrompt(event: Event) {
        console.log('Setting global negative:', (event.target as HTMLTextAreaElement).value);
        globalNegativePrompt = (event.target as HTMLTextAreaElement).value;
        updateValue();
    }
</script>

<div class="mb-6 w-full {hidden ? 'hidden' : ''}">
    <label for={id} class="block font-semibold mb-2">{label}</label>

    <!-- Add global prompt fields -->
    <div class="grid grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 bg-blue-50">
        <div class="flex flex-col">
            <Label label="Global Positive Prompt" for_id="global-positive" />
            <Textarea
                id="global-positive"
                bind:value={globalPositivePrompt}
                on:input={handleGlobalPositivePrompt}
            />
        </div>
        
        <div class="flex flex-col">
            <Label label="Global Negative Prompt" for_id="global-negative" />
            <Textarea
                id="global-negative"
                bind:value={globalNegativePrompt}
                on:input={handleGlobalNegativePrompt}
            />
        </div>
    </div>

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
