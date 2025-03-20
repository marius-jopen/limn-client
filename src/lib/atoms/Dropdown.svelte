<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    
    // Props
    export let position: "top" | "bottom" | "left" | "right" = "top";
    export let width: string = "min-w-[150px]";
    export let containerClass: string = "";
    
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
</script>

<div class="dropdown-container relative {containerClass}" bind:this={dropdownRef}>
    <!-- Trigger slot -->
    <div on:click={toggle}>
        <slot name="trigger"></slot>
    </div>
    
    <!-- Dropdown content -->
    {#if isOpen}
        <div class="absolute {positionClasses} right-0 bg-white shadow-lg rounded-md z-10 {width} overflow-hidden">
            <slot name="content"></slot>
        </div>
    {/if}
</div> 