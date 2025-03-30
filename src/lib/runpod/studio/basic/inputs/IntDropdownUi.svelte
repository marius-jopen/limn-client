<script lang="ts">
    import Dropdown from '$lib/atoms/Dropdown.svelte';
    import Button from '$lib/atoms/Button.svelte';
    
    interface DropdownOption {
        value: number;
        label: string;
    }

    export let id: string = "";
    export let value: number = 15;
    export let options: DropdownOption[] = [];
    export let hidden: boolean = false;
    export let prefix: string = "";
    export let label: string = "";

    let dropdown: Dropdown;
    let isOpen = false;

    function handleSelect(newValue: string | number) {
        value = typeof newValue === 'string' ? parseInt(newValue) : newValue;
        dropdown.close();
    }

    function handleToggle(event: CustomEvent<{isOpen: boolean}>) {
        isOpen = event.detail.isOpen;
    }

    // Get the current selected option's label
    $: selectedOption = options.find(opt => opt.value === value);
    $: displayText = `${prefix}${label}: ${selectedOption?.label || value}`;
    $: mobileText = `${prefix}${label}`;
</script>

<div 
    on:mouseenter 
    on:mouseleave
    class="{hidden ? 'hidden' : ''} relative"
>
    <Dropdown 
        position="top" 
        containerClass="left-0" 
        width="" 
        bind:this={dropdown}
        on:toggle={handleToggle}
    >
        <div slot="trigger">
            <Button 
                variant="quaternary" 
                classes="text-sm {isOpen ? 'bg-gray-300' : ''}"
            >
                <span class="hidden md:inline whitespace-nowrap">{displayText}</span>
                <span class="md:hidden whitespace-nowrap">{mobileText}</span>
            </Button>
        </div>
        
        <div slot="content">
            {#each options as option}
                <button
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-300 transition-colors {value === option.value ? 'bg-gray-200' : ''}"
                    on:click={() => handleSelect(option.value)}
                >
                    {option.label} 
                </button>
            {/each}
        </div>
    </Dropdown>
</div>
