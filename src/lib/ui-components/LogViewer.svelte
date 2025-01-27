<script>
    import Label from '../atomic-components/Label.svelte';
    
    export let logs = [];
    export let maxHeight = "300px";
    export let label
    
    // Bind the container for auto-scrolling
    export let containerRef;
    
    // Dark mode toggle
    export let variant = "dark"; // can be "dark" or "light"

    // Computed classes based on variant
    $: containerClasses = `
        p-4 rounded font-mono text-sm overflow-y-auto
        ${variant === "dark" 
            ? 'bg-black text-green-400' 
            : 'bg-white text-gray-800 border border-gray-300'}
    `.trim();
</script>

{#if logs.length > 0}
    <div class="flex flex-col gap-2">
        <Label {label} />

        <div 
            bind:this={containerRef}
            class={containerClasses}
            style="max-height: {maxHeight}"
        >
            {#each logs as log}
                <div class="whitespace-pre-wrap">
                    {log}
                </div>
            {/each}
        </div>
    </div>
{/if}