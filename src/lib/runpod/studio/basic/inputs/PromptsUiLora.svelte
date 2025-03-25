<script lang="ts">
    import Label from "$lib/atoms/Label.svelte";
    import Textarea from "$lib/atoms/InputTextarea.svelte";
    import Button from "$lib/atoms/Button.svelte";
    import InputText from "$lib/atoms/InputText.svelte";

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
    
    <!-- Active LoRA bubbles - Moved above and restyled -->
    {#if activeLoras.length > 0}
        <div class="flex flex-wrap gap-1 mb-2">
            {#each activeLoras as lora}
                <div class="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full text-xs">
                    <span class="font-semibold px-2 py-1 text-gray-700">{lora.label}</span>
                    <div class="flex items-center border-l border-gray-200">
                        <input
                            type="number"
                            class="w-12 px-1 py-1 bg-transparent border-0 text-center text-xs"
                            min="0"
                            max="2"
                            step="0.1"
                            value={lora.strength}
                            on:input={(e) => updateStrength(lora.value, parseFloat(e.currentTarget.value))}
                        />
                        <button
                            class="px-1.5 py-1 text-gray-400 hover:text-gray-600 border-l border-gray-200"
                            on:click={() => removeLora(lora.value)}
                        >×</button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <Textarea 
        {id} 
        bind:value={userText}
    />

    <Button
        label="Add LoRA"
        variant="secondary"
        size="sm"
        onClick={() => isOverlayOpen = true}
    />
</div>

<!-- LoRA Selection Overlay -->
{#if isOverlayOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg w-[800px] max-h-[80vh] flex flex-col">
            <!-- Header -->
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-semibold">Select LoRA</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    label="×"
                    onClick={() => {
                        isOverlayOpen = false;
                        searchTerm = "";
                    }}
                    classes="h-8 w-8 p-0 text-xl"
                />
            </div>

            <!-- Search -->
            <div class="p-4 border-b">
                <InputText
                    type="text"
                    placeholder="Search LoRAs..."
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