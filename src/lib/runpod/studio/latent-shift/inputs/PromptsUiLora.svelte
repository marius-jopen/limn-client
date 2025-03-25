<script lang="ts">
    import Button from "$lib/atoms/Button.svelte";
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    interface DropdownOption {
        value: string;
        label: string;
        trigger: string;
        image: string;
        description: string;
    }

    interface ActiveLora {
        value: string;
        label: string;
        strength: number;
        trigger: string;
    }

    export let label: string = "";
    export let value: string = "";
    export let userText: string = "";
    export let id: string = "";
    export let hidden: boolean = false;
    export let options: DropdownOption[] = [];

    let activeLoras: ActiveLora[] = [];
    let isOverlayOpen = false;
    let searchTerm = "";

    // Filter options based on search term
    $: filteredOptions = options.filter(option => 
        !activeLoras.some(lora => lora.value === option.value) &&
        (option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
         option.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(option => ({
        ...option,
        image: transformToBunnyUrl(option.image) + "?width=200"
    }));

    function handleLoraSelect(option: DropdownOption) {
        activeLoras = [...activeLoras, { 
            value: option.value,
            label: option.label,
            strength: 1,
            trigger: option.trigger 
        }];
        isOverlayOpen = false;
        searchTerm = "";
    }

    function updateStrength(loraValue: string, newStrength: number) {
        if (newStrength < 0 || newStrength > 2) return;
        activeLoras = activeLoras.map(lora => 
            lora.value === loraValue 
                ? { ...lora, strength: newStrength }
                : lora
        );
    }

    function removeLora(loraValue: string) {
        activeLoras = activeLoras.filter(lora => lora.value !== loraValue);
    }

    $: {
        const loraTags = activeLoras
            .map(lora => `<lora:${lora.value}:${lora.strength}> ${lora.trigger}`)
            .join(" ");
        value = `${userText} ${loraTags}`.trim();
    }

    $: {
        if (userText !== value.split('<lora:')[0].trim()) {
            const loraTags = activeLoras
                .map(lora => `<lora:${lora.value}:${lora.strength}> ${lora.trigger}`)
                .join(" ");
            value = `${userText} ${loraTags}`.trim();
        }
    }

    // Add this function
    export function openLoraOverlay() {
        isOverlayOpen = true;
    }
</script>

<div class="flex flex-col gap-2 {hidden ? 'hidden' : ''}">
    <!-- Textarea first -->
    <textarea 
        {id}
        bind:value={userText}
        class="text-sm w-full min-h-[70px] rounded-lg bg-transparent border-none 
               focus:outline-none focus:ring-0
               text-gray-800 placeholder-gray-560 resize-none"
        placeholder="Describe what you want to create..."
    />
    
    <!-- Active LoRA bubbles - Now below the textarea -->
    {#if activeLoras.length > 0}
        <div class="flex flex-wrap gap-1">
            {#each activeLoras as lora}
                <div class="inline-flex items-center bg-gray-200 transition-all duration-300 hover:bg-gray-300 pl-2 pr-1 mb-1 border-gray-300 rounded-full text-xs">
                    <span class="px-2 py-2 text-gray-700">{lora.label}</span>
                    <div class="flex items-center border-l border-gray-300">
                        <!-- Minus button -->
                        <button
                            class="px-1.5 py-1 text-gray-500 hover:text-gray-700"
                            on:click={() => updateStrength(lora.value, Number((lora.strength - 0.1).toFixed(1)))}
                        >
                            -
                        </button>

                        <input
                            type="number"
                            class="w-8 px-0 py-1 bg-transparent border-0 text-center text-xs
                                   focus:outline-none focus:ring-0 focus:border-0
                                   [appearance:textfield] 
                                   [&::-webkit-outer-spin-button]:appearance-none 
                                   [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="2"
                            step="0.1"
                            value={lora.strength.toFixed(1)}
                            on:input={(e) => updateStrength(lora.value, Number(parseFloat(e.currentTarget.value).toFixed(1)))}
                        />

                        <!-- Plus button -->
                        <button
                            class="px-1.5 py-1 text-gray-500 hover:text-gray-700"
                            on:click={() => updateStrength(lora.value, Number((lora.strength + 0.1).toFixed(1)))}
                        >
                            +
                        </button>

                        <!-- Close button -->
                        <button
                            class="px-1.5 py-1 text-gray-400 hover:text-gray-600 border-l border-gray-300"
                            on:click={() => removeLora(lora.value)}
                        >×</button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <Button
        classes="hidden"
        label="Add LoRA"
        variant="secondary"
        size="sm"
        onClick={() => isOverlayOpen = true}
    />
</div>

<!-- LoRA Selection Overlay -->
{#if isOverlayOpen}
    <div 
        class="fixed bg-neutral-100/80 backdrop-blur-2xl inset-0 z-50 flex items-center justify-center"
        on:click|self={() => {
            isOverlayOpen = false;
            searchTerm = "";
        }}
        transition:fade={{ duration: 200 }}
    >
        <!-- Close button fixed to top-right of screen -->
        <Button 
            variant="secondary"
            size="sm"
            label="Close"
            onClick={() => {
                isOverlayOpen = false;
                searchTerm = "";
            }}
            classes="fixed top-3 right-4 text-sm z-[51]"
        />

        <div 
            class="bg-gray-200 rounded-lg w-[800px] max-h-[80vh] flex flex-col overflow-hidden"
            transition:scale={{ 
                duration: 300, 
                delay: 100,
                easing: quintOut,
                start: 0.95
            }}
        >
            <!-- <div class="p-6 text-center w-8/12 mx-auto">
                <h2 class="text-xl font-semibold mb-2">Select a Style</h2>
                <p class="text-gray-600">
                    Choose a style below. After selection, you can adjust its strength using the number input in the bubble above your prompt field.
                </p>
            </div> -->

            
            <!-- LoRA Grid -->
            <div class="p-3 overflow-y-auto flex-1 grid grid-cols-2 gap-2">
                {#each filteredOptions as option}
                    <div 
                        class="flex bg-gray-100 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        on:click={() => handleLoraSelect(option)}
                    >
                        <img 
                            src={option.image} 
                            alt={option.label} 
                            class="w-24 h-24 object-cover rounded-l-md"
                        />
                        <div class="py-2 px-3">
                            <div class="font-medium">{option.label}</div>
                            <div class="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}