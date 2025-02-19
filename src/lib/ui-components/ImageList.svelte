<script>
    import Label from '$lib/atomic-components/Label.svelte';
    export let images = [];
    export let label;
    export let id;
    
    // Add state for overlay
    let showOverlay = false;
    let selectedImage = '';

    // Function to open overlay
    function openOverlay(imageUrl) {
        selectedImage = imageUrl;
        showOverlay = true;
    }

    // Function to close overlay
    function closeOverlay() {
        showOverlay = false;
        selectedImage = '';
    }
</script>

{#if images.length > 0}
    <Label for_id={id} {label} />

    <div class="space-y-4">
        {#each images as imageUrl}
            <!-- Changed from <a> to <button> -->
            <button 
                on:click={() => openOverlay(imageUrl)} 
                class="w-full text-left flex items-center gap-4 p-2 bg-white rounded-lg border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                <img 
                    src={imageUrl} 
                    alt="Thumbnail" 
                    class="w-48 h-48 object-cover rounded"
                />
                
                <div class="flex flex-col">
                    <span class="text-gray-600 pb-2">
                        {imageUrl.split('/').pop().split('?')[0]}
                    </span>

                    <div class="text-xs text-gray-400 break-all">
                        {imageUrl}
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <!-- Add overlay -->
    {#if showOverlay}
        <div 
            class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            on:click={closeOverlay}
        >
            <div class="max-w-[90vw] max-h-[90vh]">
                <img 
                    src={selectedImage} 
                    alt="Full size" 
                    class="max-w-full max-h-[90vh] object-contain"
                />
            </div>
        </div>
    {/if}
{/if} 