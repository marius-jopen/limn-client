<script>
    export let images = [];
    
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

    // Helper function to get image URL from image object or string
    function getImageUrl(image) {
        return typeof image === 'object' ? image.url : image;
    }

    // Helper function to get image filename
    function getImageFilename(imageUrl) {
        return imageUrl.split('/').pop().split('?')[0];
    }
</script>

{#if images.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {#each images as image}
            {@const imageUrl = getImageUrl(image)}
            <button 
                on:click={() => openOverlay(imageUrl)} 
                class=""
            >
                <img 
                    src={imageUrl} 
                    alt="Thumbnail" 
                    class="w-full h-auto object-cover square"
                />
                
                <div class="flex flex-col">
                    <span class="text-gray-600 pb-2">
                        {getImageFilename(imageUrl)}
                    </span>
                </div>
            </button>
        {/each}
    </div>
{/if} 