<script lang="ts">
    // Define types for the image object
    type ImageObject = {
        url: string;
        // Add other potential properties here if needed
    };

    type ImageInput = ImageObject | string;

    export let images: ImageInput[] = [];
    
    // Add check for previous images to prevent unwanted resets
    let previousImages = images;
    $: {
        if (images.length === 0 && previousImages.length > 0) {
            // Keep previous images if new array is empty
            images = previousImages;
        } else {
            previousImages = images;
        }
    }

    // Add state for overlay
    let showOverlay = false;
    let selectedImage: string = '';

    // Function to open overlay
    function openOverlay(imageUrl: string): void {
        selectedImage = imageUrl;
        showOverlay = true;
    }

    // Function to close overlay
    function closeOverlay(): void {
        showOverlay = false;
        selectedImage = '';
    }

    // Helper function to get image URL from image object or string
    function getImageUrl(image: ImageInput): string {
        return typeof image === 'object' ? image.url : image;
    }

    // Helper function to get image filename
    function getImageFilename(imageUrl: string): string {
        return imageUrl.split('/').pop()?.split('?')[0] ?? '';
    }
</script>

<div class="flex flex-wrap bg-gray-100 h-full justify-left">
    {#if images.length > 0}
        {#each images as image}
            {@const imageUrl = getImageUrl(image)}
            <button 
                on:click={() => openOverlay(imageUrl)} 
                class="w-full {images.length > 1 ? 'sm:w-1/2 md:w-1/2 lg:w-1/4' : ''}"
            >
                <img 
                    src={imageUrl} 
                    alt="Thumbnail" 
                    class="w-full h-auto object-cover square"
                />
            </button>
        {/each}
    {/if} 
</div>

<!-- Add Image Overlay -->
{#if showOverlay}
    <div 
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        on:click={closeOverlay}
    >
        <div class="relative max-w-4xl max-h-[90vh]">
            <button 
                class="absolute top-4 right-4 text-white text-xl font-bold p-2 hover:text-gray-300"
                on:click={closeOverlay}
            >
                ×
            </button>
            <img 
                src={selectedImage} 
                alt="Full size" 
                class="max-h-[90vh] w-auto"
            />
        </div>
    </div>
{/if} 