<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import Label from '$lib/atoms/Label.svelte';
    import Textarea from '$lib/atoms/InputTextarea.svelte';
    import InputText from '$lib/atoms/InputText.svelte';
    import Dropdown from '$lib/atoms/Dropdown.svelte';
    import PromptsUiLora from './PromptsUiLora.svelte';  // Import the LoRA component

    export let id: string;
    export let label: string;
    export let value: string = '{}';
    export let hidden: boolean = false;
    export let options: DropdownOption[] = [];  // Make sure we receive the options
    export let defaultValues: any = undefined;
    export let promptMode: 'clean' | 'original' = 'clean';

    const dispatch = createEventDispatcher();

    // Add all our state variables at the top
    let globalPositiveText: string = '';
    let globalPositiveWithLora: string = '';
    let globalNegativePrompt: string = '';
    let hasUserEdits: boolean = false;
    let defaultPrompts: { [frame: string]: string } = {};
    let entries: { frame: string; prompt: string; negativePrompt: string }[] = [];
    let prompts: { [frame: string]: string } = {};
    let globalPositiveHidden: string = '';
    let globalNegativeHidden: string = '';

    let loraComponent: { openLoraOverlay: () => void };

    // Parse the initial value and set defaults
    try {
        if (value) {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            const defaults = defaultValues || parsed.default;
            
            console.log('Parsing initialization:');
            console.log('Parsed value:', parsed);
            console.log('Default values:', defaultValues);
            console.log('Using defaults:', defaults);

            // Set global prompts from defaults
            if (parsed.globalPositive) {
                globalPositiveText = parsed.globalPositive;
                globalPositiveWithLora = parsed.globalPositive;
            } else if (defaults?.globalPositive) {
                globalPositiveText = defaults.globalPositive;
                globalPositiveWithLora = defaults.globalPositive;
            }

            // Set global negative prompts
            if (parsed.globalNegative) {
                globalNegativePrompt = parsed.globalNegative;
            } else if (defaults?.globalNegative) {
                globalNegativePrompt = defaults.globalNegative;
            }

            // Set hidden prompts
            if (defaults?.globalPositiveHidden) {
                globalPositiveHidden = defaults.globalPositiveHidden;
                console.log('Set globalPositiveHidden:', globalPositiveHidden);
            }
            if (defaults?.gobalNegativeHidden) {
                globalNegativeHidden = defaults.gobalNegativeHidden;
                console.log('Set globalNegativeHidden:', globalNegativeHidden);
            } else {
                console.log('No globalNegativeHidden found in defaults:', defaults);
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
            } else if (defaults?.frames) {
                entries = Object.entries(defaults.frames).map(([frame, promptValue]) => {
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
        console.error('Error details:', e.message);
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

    $: {
        // This will run whenever entries changes
        if (entries) {
            console.log('Entries changed:', entries);
            updateValue();
        }
    }

    $: {
        if (promptMode) {
            console.log('Prompt mode changed to:', promptMode);
            updateValue();
        }
    }

    function updateValue() {
        console.log('=== updateValue start ===');
        console.log('Global Positive with LoRA:', globalPositiveWithLora);
        console.log('Global Negative:', globalNegativePrompt);
        console.log('Global Negative Hidden:', globalNegativeHidden);
        console.log('All entries:', entries);
        console.log('Current mode:', promptMode);

        prompts = {};
        entries.sort((a, b) => (parseInt(a.frame) || 0) - (parseInt(b.frame) || 0))
              .forEach((entry) => {
                  if (entry.frame) {
                      console.log('Processing entry:', entry);
                      
                      // Build positive prompt
                      const positiveComponents = [];
                      if (globalPositiveWithLora) positiveComponents.push(globalPositiveWithLora);
                      if (entry.prompt && entry.prompt.trim()) {
                          console.log('Adding entry prompt:', entry.prompt);
                          positiveComponents.push(entry.prompt);
                      }
                      // Add hidden prompts in clean mode only
                      if (promptMode === 'clean' && globalPositiveHidden) {
                          positiveComponents.push(globalPositiveHidden);
                      }
                      
                      // Build negative prompt
                      const negativeComponents = [];
                      if (globalNegativePrompt) negativeComponents.push(globalNegativePrompt);
                      if (entry.negativePrompt && entry.negativePrompt.trim()) {
                          console.log('Adding entry negative:', entry.negativePrompt);
                          negativeComponents.push(entry.negativePrompt);
                      }
                      // Add hidden negative prompts in clean mode only
                      if (promptMode === 'clean' && globalNegativeHidden) {
                          negativeComponents.push(globalNegativeHidden);
                      }

                      const finalPositive = positiveComponents.join(' ');
                      const finalNegative = negativeComponents.join(' ');

                      prompts[entry.frame] = `${finalPositive.trim()} --neg ${finalNegative}`.trim();
                      console.log(`Frame ${entry.frame} components:`, {
                          positive: positiveComponents,
                          negative: negativeComponents
                      });
                  }
              });
        
        value = JSON.stringify(prompts);
        console.log('Value immediately after update:', value);
        
        // Check the value after a brief delay
        setTimeout(() => {
            console.log('Value after delay:', value);
            console.log('Hidden input value:', document.getElementById(id)?.value);
        }, 100);

        dispatch('change', value);
    }

    // Fix the addEntry function to preserve existing entries
    function addEntry() {
        // Find the next available frame number
        const maxFrame = entries.length > 0 
            ? Math.max(...entries.map(e => parseInt(e.frame) || 0)) 
            : -1;
        const nextFrame = (maxFrame + 5).toString();
        
        // Create new entry while preserving existing ones
        entries = [
            ...entries,
            { frame: nextFrame, prompt: '', negativePrompt: '' }
        ];
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

    // Make sure the entry update handlers preserve the values
    function handleInputPrompt(event: Event, index: number) {
        hasUserEdits = true;
        const target = event.target as HTMLTextAreaElement;
        console.log('Handling prompt input:', {
            index,
            newValue: target.value,
            currentEntries: entries
        });
        
        entries = entries.map((entry, i) => {
            if (i === index) {
                const updated = { ...entry, prompt: target.value };
                console.log('Updated entry:', updated);
                return updated;
            }
            return entry;
        });
        
        console.log('Entries after update:', entries);
        updateValue();
    }

    function handleInputNegativePrompt(event: Event, index: number) {
        hasUserEdits = true;
        const target = event.target as HTMLTextAreaElement;
        entries = entries.map((entry, i) => 
            i === index 
                ? { ...entry, negativePrompt: target.value }
                : entry
        );
        updateValue();
    }

    function handleGlobalNegativePrompt(event: Event) {
        console.log('Setting global negative:', (event.target as HTMLTextAreaElement).value);
        globalNegativePrompt = (event.target as HTMLTextAreaElement).value;
        updateValue();
    }

    // Add this to expose the function up to InputController
    export function openLoraOverlay() {
        // Call the LoRA component's openLoraOverlay
        loraComponent?.openLoraOverlay();
    }

    $: {
        if (value) {
            console.log('Value changed reactively:', value);
        }
    }
</script>

<div class="w-full {hidden ? 'hidden' : ''}">
    <!-- Mode selector dropdown -->
    <div class="flex justify-end mb-4 hidden">
        <Dropdown position="bottom">
            <div slot="trigger" class="cursor-pointer px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200">
                {promptMode === 'clean' ? 'Clean' : 'Original'}
            </div>
            <div slot="content" class="p-2">
                <div 
                    class="cursor-pointer px-3 py-1 hover:bg-gray-300 rounded {promptMode === 'clean' ? 'bg-gray-300' : ''}"
                    on:click={() => {
                        console.log('Switching to clean mode');
                        promptMode = 'clean';
                        updateValue();
                    }}
                >
                    Clean
                </div>
                <div 
                    class="cursor-pointer px-3 py-1 hover:bg-gray-300 rounded {promptMode === 'original' ? 'bg-gray-300' : ''}"
                    on:click={() => {
                        console.log('Switching to original mode');
                        promptMode = 'original';
                        updateValue();
                    }}
                >
                    Original
                </div>
            </div>
        </Dropdown>
    </div>

    <!-- <label for={id} class="block font-semibold mb-2">{label}</label> -->

    <!-- Global prompt fields -->
    <div class=" ">
        <div class="flex flex-col">
            <PromptsUiLora
                bind:this={loraComponent}
                label="Global Positive Prompt"
                id="global-positive"
                bind:value={globalPositiveWithLora}
                userText={globalPositiveText}
                options={options}
            />
        </div>
        
        <div class="flex flex-col mt-4 hidden">
            <Label label="Global Negative Prompt" for_id="global-negative" />
            <Textarea
                id="global-negative"
                bind:value={globalNegativePrompt}
                on:input={handleGlobalNegativePrompt}
            />
        </div>
    </div>

    <div class="flex flex-col gap-4 mb-4 hidden">
        {#each entries as entry, index}
            <div class="rounded-md grid grid-cols-[80px_1fr_1fr_40px] gap-4 p-4 border border-gray-200 bg-gray-50">
                <div>
                    <Label label="Frame" for_id={`frame-${index}`} />
                    <InputText
                        id={`frame-${index}`}
                        type="number"
                        bind:value={entry.frame}
                    />
                </div>
                
                <div class="flex flex-col">
                    <Label label="Prompt" for_id={`prompt-${index}`} />
                    <Textarea
                        id={`prompt-${index}`}
                        bind:value={entry.prompt}
                        on:input={() => {
                            console.log('Prompt changed:', entry.prompt);
                            updateValue();
                        }}
                    />
                </div>
                
                <div class="flex flex-col">
                    <Label label="Negative Prompt" for_id={`negative-${index}`} />
                    <Textarea
                        id={`negative-${index}`}
                        bind:value={entry.negativePrompt}
                        on:input={() => {
                            console.log('Negative prompt changed:', entry.negativePrompt);
                            updateValue();
                        }}
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
        classes="hidden"
    />
    
    <input type="hidden" {id} {value} />
</div>
