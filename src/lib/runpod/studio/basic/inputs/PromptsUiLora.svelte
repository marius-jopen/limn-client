<script lang="ts">
    import Label from "$lib/atoms/Label.svelte";
    import Textarea from "$lib/atoms/InputTextarea.svelte";

    interface DropdownOption {
        value: string;
        label: string;
        trigger: string;
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

    function handleLoraClick(option: DropdownOption) {
        const existingIndex = activeLoras.findIndex(lora => lora.value === option.value);
        
        if (existingIndex >= 0) {
            activeLoras = activeLoras.filter(lora => lora.value !== option.value);
        } else {
            activeLoras = [...activeLoras, { 
                ...option, 
                strength: 1,
                trigger: option.trigger 
            }];
        }
    }

    function updateStrength(loraValue: string, newStrength: number) {
        if (newStrength < 0 || newStrength > 2) return;
        
        activeLoras = activeLoras.map(lora => 
            lora.value === loraValue 
                ? { ...lora, strength: newStrength }
                : lora
        );
    }

    // Make the reactive statement more explicit
    $: {
        const loraTags = activeLoras
            .map(lora => `<lora:${lora.value}:${lora.strength}> ${lora.trigger}`)
            .join(" ");
        value = `${userText} ${loraTags}`.trim();
        console.log('Updated LoRA value:', value);
    }

    // Add a reactive statement for userText changes
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
                    on:click={() => handleLoraClick(lora)}
                >×</button>
            </div>
        {/each}
    </div>

    <!-- Available LoRA options -->
    <div class="flex flex-wrap gap-2">
        {#each options.filter(option => !activeLoras.some(lora => lora.value === option.value)) as option}
            <button
                class="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm"
                on:click={() => handleLoraClick(option)}
            >
                {option.label}
            </button>
        {/each}
    </div>

    <!-- Complete prompt preview -->
    <!-- <div class="mt-4">
        <Label for_id={`${id}-complete`} label="Complete Prompt (with LoRA tags)" />
        <Textarea
            id={`${id}-complete`}
            value={value}
            readonly={true}
            class="font-mono text-sm"
        />
    </div> -->
</div> 