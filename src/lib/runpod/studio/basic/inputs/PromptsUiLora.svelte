<script lang="ts">
    import Label from "$lib/atoms/Label.svelte";
    import Textarea from "$lib/atoms/InputTextarea.svelte";
    import Button from "$lib/atoms/Button.svelte";

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
    );

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
</script>

<div class="flex flex-col gap-2 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <Textarea 
        {id} 
        bind:value={userText}
    />

    <!-- Replace the button with Button component -->
    <Button
        label="Add LoRA"
        variant="secondary"
        size="sm"
        onClick={() => isOverlayOpen = true}
    />

    <!-- Active LoRA bubbles -->
    <div class="flex flex-wrap gap-2 mt-2">
        {#each activeLoras as lora}
            <div class="flex items-center gap-2 bg-gray-200 rounded-full px-3 py-1">
                <span>{lora.label}</span>
                <input
                    type="number"
                    class="w-16 text-sm bg-transparent"
                    min="0"
                    max="2"
                    step="0.1"
                    value={lora.strength}
                    on:input={(e) => updateStrength(lora.value, parseFloat(e.currentTarget.value))}
                />
                <button
                    class="ml-1 text-gray-600 hover:text-gray-800"
                    on:click={() => removeLora(lora.value)}
                >×</button>
            </div>
        {/each}
    </div>
</div>

<!-- LoRA Selection Overlay -->
{#if isOverlayOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg w-[800px] max-h-[80vh] flex flex-col">
            <!-- Header -->
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-semibold">Select LoRA</h2>
                <button 
                    class="text-gray-500 hover:text-gray-700"
                    on:click={() => {
                        isOverlayOpen = false;
                        searchTerm = "";
                    }}
                >
                    ×
                </button>
            </div>

            <!-- Search -->
            <div class="p-4 border-b">
                <input
                    type="text"
                    placeholder="Search LoRAs..."
                    class="w-full px-3 py-2 border rounded-md"
                    bind:value={searchTerm}
                />
            </div>

            <!-- LoRA Grid -->
            <div class="p-4 overflow-y-auto grid grid-cols-2 gap-4">
                {#each filteredOptions as option}
                    <div 
                        class="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        on:click={() => handleLoraSelect(option)}
                    >
                        <img 
                            src={option.image} 
                            alt={option.label} 
                            class="w-24 h-24 object-cover rounded-md"
                        />
                        <div>
                            <div class="font-medium">{option.label}</div>
                            <div class="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    /* Prevent body scroll when overlay is open */
    :global(body) {
        overflow: hidden;
    }
</style> 