<script>
    export let fields = [];
    
    // Optional: Allow customization of the container styles
    export let containerClass = "grid grid-cols-2 border border-gray-200 overflow-hidden bg-white divide-x divide-gray-200";
    export let labelClass = "font-medium p-3 border-b border-gray-200";
    export let valueClass = "p-3 border-b border-gray-200";
</script>

<div class={containerClass}>
    {#each fields as {label, value, isLast = false}}
        <div class="contents">
            <div class={isLast ? labelClass.replace('border-b', '') : labelClass}>
                {label}:
            </div>
            
            <div class={isLast ? valueClass.replace('border-b', '') : valueClass}>
                {value}
            </div>
        </div>
    {/each}
</div> 