<script lang="ts">
    import Dropdown from '$lib/atoms/Dropdown.svelte';
    import Button from '$lib/atoms/Button.svelte';
    
    interface DropdownOption {
        value: string;
        label: string;
    }

    export let id: string = "";
    export let value: string = "15";
    export let options: DropdownOption[] = [];
    export let hidden: boolean = false;

    let dropdown: Dropdown;
    let isOpen = false;

    function handleSelect(newValue: string) {
        value = newValue;
        dropdown.close();
    }

    function handleToggle(event: CustomEvent<{isOpen: boolean}>) {
        isOpen = event.detail.isOpen;
    }
</script>

<div class="{hidden ? 'hidden' : ''} relative">
    <Dropdown 
        position="top" 
        containerClass="left-0" 
        width="w-[120px]" 
        bind:this={dropdown}
        on:toggle={handleToggle}
    >
        <div slot="trigger">
            <Button 
                variant="secondary" 
                classes="text-sm {isOpen ? 'bg-gray-300' : ''}"
            >
                🕒 {value} frames
            </Button>
        </div>
        
        <div slot="content">
            {#each options as option}
                <button
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-300 transition-colors"
                    on:click={() => handleSelect(option.value)}
                >
                    {option.value} frames
                </button>
            {/each}
        </div>
    </Dropdown>
</div>
