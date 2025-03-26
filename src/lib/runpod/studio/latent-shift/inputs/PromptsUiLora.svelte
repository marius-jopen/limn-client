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
        class="text-md w-full min-h-[120px] md:min-h-[70px] rounded-lg bg-transparent border-none 
               focus:outline-none focus:ring-0
               text-gray-800 placeholder-gray-560 resize-none"
        placeholder="Describe what you want to create..."
    />
    
    <!-- Active LoRA bubbles - Now below the textarea -->
    {#if activeLoras.length > 0}
        <div class="flex flex-wrap gap-1">
            {#each activeLoras as lora}
                <div class="inline-flex items-center bg-gray-100 transition-all duration-300 hover:bg-gray-300 pl-2 pr-1 mb-1 border-gray-300 rounded-full text-xs">
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
        class="fixed bg-neutral-100/80 backdrop-blur-2xl inset-0 z-50"
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

        <!-- Scrollable content area -->
        <div class="h-full overflow-y-auto">
            <div class="flex justify-center min-h-full py-16">
                <div class="p-4 w-full md:w-[800px] pt-20">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {#each filteredOptions as option}
                            <div 
                                class="bg-white rounded-lg hover:bg-gray-50 cursor-pointer overflow-hidden"
                                on:click={() => handleLoraSelect(option)}
                            >
                                <div class="overflow-hidden">
                                    <img 
                                        src={option.image} 
                                        alt={option.label} 
                                        class="w-full h-48 object-cover rounded-t-lg md:rounded-t-none md:rounded-tl-lg md:rounded-tr-lg transition-transform duration-300 hover:scale-110"
                                    />
                                </div>
                                <div class="p-3">
                                    <div class="font-medium">{option.label}</div>
                                    <div class="text-sm text-gray-600 mt-1">{option.description}</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}