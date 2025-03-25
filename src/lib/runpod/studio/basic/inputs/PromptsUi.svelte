<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import Label from '$lib/atoms/Label.svelte';
    import Textarea from '$lib/atoms/InputTextarea.svelte';
    import InputText from '$lib/atoms/InputText.svelte';
    import PromptsUiLora from './PromptsUiLora.svelte';  // Import the LoRA component

    export let id: string;
    export let label: string;
    export let value: string = '{}';
    export let hidden: boolean = false;
    export let options: DropdownOption[] = [];  // Make sure we receive the options

    const dispatch = createEventDispatcher();

    // Add all our state variables at the top
    let globalPositiveText: string = '';
    let globalPositiveWithLora: string = '';
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
                globalPositiveText = parsed.globalPositive;
                globalPositiveWithLora = parsed.globalPositive;
            } else if (parsed.default?.globalPositive) {
                globalPositiveText = parsed.default.globalPositive;
                globalPositiveWithLora = parsed.default.globalPositive;
            }

            if (parsed.globalNegative) {
                globalNegativePrompt = parsed.globalNegative;
            } else if (parsed.default?.globalNegative) {
                globalNegativePrompt = parsed.default.globalNegative;
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
            } else if (parsed.default?.frames) {
                entries = Object.entries(parsed.default.frames).map(([frame, promptValue]) => {
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

    $: {
        // This reactive statement will run whenever globalPositiveWithLora changes
        if (globalPositiveWithLora) {
            updateValue();
        }
    }

    function updateValue() {
        console.log('=== updateValue start ===');
        console.log('Global Positive with LoRA:', globalPositiveWithLora);
        console.log('Global Negative:', globalNegativePrompt);
        console.log('Entries:', entries);

        prompts = {};
        entries.sort((a, b) => (parseInt(a.frame) || 0) - (parseInt(b.frame) || 0))
              .forEach((entry) => {
                  if (entry.frame) {
                      let positivePrompt = '';
                      if (globalPositiveWithLora && entry.prompt) {
                          positivePrompt = `${globalPositiveWithLora} ${entry.prompt}`;
                      } else if (globalPositiveWithLora) {
                          positivePrompt = globalPositiveWithLora;
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

    function handleGlobalNegativePrompt(event: Event) {
        console.log('Setting global negative:', (event.target as HTMLTextAreaElement).value);
        globalNegativePrompt = (event.target as HTMLTextAreaElement).value;
        updateValue();
    }
</script>

<div class="mb-6 w-full {hidden ? 'hidden' : ''}">
    <label for={id} class="block font-semibold mb-2">{label}</label>

    <!-- Global prompt fields -->
    <div class="mb-6 p-4 border border-gray-200 rounded-md">
        <div class="flex flex-col">
            <PromptsUiLora
                label="Global Positive Prompt"
                id="global-positive"
                bind:value={globalPositiveWithLora}
                userText={globalPositiveText}
                options={options}
            />
        </div>
        
        <div class="flex flex-col mt-4">
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
            <div class="rounded-md grid grid-cols-[80px_1fr_1fr_40px] gap-4 p-4 border border-gray-200 bg-gray-50">
                <div>
                    <Label label="Frame" for_id={`frame-${index}`} />
                    <InputText
                        id={`frame-${index}`}
                        type="number"
                        value={entry.frame}
                        on:input={(e) => handleInputFrame(e, index)}
                    />
                </div>
                
                <div class="flex flex-col">
                    <Label label="Prompt" for_id={`prompt-${index}`} />
                    <Textarea
                        id={`prompt-${index}`}
                        value={entry.prompt}
                        on:input={(e) => handleInputPrompt(e, index)}
                    />
                </div>
                
                <div class="flex flex-col">
                    <Label label="Negative Prompt" for_id={`negative-${index}`} />
                    <Textarea
                        id={`negative-${index}`}
                        value={entry.negativePrompt}
                        on:input={(e) => handleInputNegativePrompt(e, index)}
                    />
                </div>
                
                <Button 
                    variant="secondary"
                    size="sm"
                    label="×"
                    onClick={() => removeEntry(index)}
                    disabled={entries.length <= 1}
                    classes="h-8 w-8 p-0 text-xl"
                />
            </div>
        {/each}
    </div>
    
    <Button 
        onClick={addEntry} 
        label="Add Keyframe"
        variant="secondary" 
    />
    
    <input type="hidden" {id} {value} />
</div>
