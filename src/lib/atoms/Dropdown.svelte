<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    // Props
    export let position: "top" | "bottom" | "left" | "right" = "top";
    export let width: string = "";
    export let containerClass: string = "";
    export let isSmallScreen: boolean = false;
    export let prefix: string = "";
    export let label: string = "";
    export let value: number = 0;
    
    // State
    let isOpen = false;
    let dropdownRef: HTMLDivElement;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Toggle dropdown
    function toggle() {
        isOpen = !isOpen;
        dispatch('toggle', { isOpen });
    }
    
    // Close dropdown
    export function close() {
        if (isOpen) {
            isOpen = false;
            dispatch('toggle', { isOpen });
        }
    }
    
    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
        if (isOpen && dropdownRef && !dropdownRef.contains(event.target as Node)) {
            close();
        }
    }
    
    onMount(() => {
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    });
    
    // Calculate position classes
    $: positionClasses = {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2",
        left: "right-full mr-2",
        right: "left-full ml-2"
    }[position];

    // Format display text
    $: displayText = isSmallScreen 
        ? `${prefix}${label}`
        : `${prefix}${label}: ${value}`;
</script>

<div class="dropdown-container relative" bind:this={dropdownRef}>
    <!-- Trigger slot -->
    <div on:click={toggle}>
        <slot name="trigger"></slot>
    </div>
    
    <!-- Dropdown content with animation -->
    {#if isOpen}
        <div 
            class="absolute {positionClasses} right-0 bg-gray-200 shadow-mdcan rounded-md z-10 {width} overflow-hidden {containerClass}"
            in:fly={{ y: 5, duration: 150, easing: quintOut }}
            out:fade={{ duration: 100 }}
        >
            <slot name="content"></slot>
        </div>
    {/if}
</div>

<style>
    /* Base dropdown styles */
    .dropdown-container {
        display: inline-block;
    }
</style> 