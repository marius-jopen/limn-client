<script context="module" lang="ts">
    // Define types for the image object
    export type ImageObject = {
        url: string;
        // Add other potential properties here if needed
    };

    export type ImageInput = ImageObject | string;
</script>

<script lang="ts">
    // Props for the Gallery component
    export let images: ImageInput[] = [];
    export let gridCols: string = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    
    // State for overlay
    let showOverlay = false;
    let selectedImage: string = '';
    let currentIndex = 0;

    // Function to open overlay
    function openOverlay(imageUrl: string, index: number): void {
        selectedImage = imageUrl;
        currentIndex = index;
        showOverlay = true;
    }

    // Function to close overlay
    function closeOverlay(): void {
        showOverlay = false;
        selectedImage = '';
    }

    // Function to navigate to the previous image
    function navigatePrevious(): void {
        if (images.length <= 1) return;
        
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        selectedImage = getImageUrl(images[currentIndex]);
    }

    // Function to navigate to the next image
    function navigateNext(): void {
        if (images.length <= 1) return;
        
        currentIndex = (currentIndex + 1) % images.length;
        selectedImage = getImageUrl(images[currentIndex]);
    }

    // Handle keyboard navigation
    function handleKeydown(event: KeyboardEvent): void {
        if (!showOverlay) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                navigatePrevious();
                break;
            case 'ArrowRight':
                navigateNext();
                break;
            case 'Escape':
                closeOverlay();
                break;
        }
    }

    // Helper function to get image URL from image object or string
    function getImageUrl(image: ImageInput): string {
        return typeof image === 'object' ? image.url : image;
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Gallery Layout -->
<div class={`grid ${gridCols} gap-1 bg-gray-100`}>
    {#if images.length > 0}
        {#each images as image, index}
            {@const imageUrl = getImageUrl(image)}
            
            <div 
                class="aspect-square overflow-hidden cursor-pointer"
                on:click={() => openOverlay(imageUrl, index)}
                on:keydown={(e) => e.key === 'Enter' && openOverlay(imageUrl, index)}
                tabindex="0"
                role="button"
                aria-label="View full size image"
            >
                <img 
                    src={imageUrl} 
                    alt="Gallery image" 
                    class="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        {/each}
    {/if} 
</div>

<!-- Image Overlay -->
{#if showOverlay}
    <div 
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        on:click={closeOverlay}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
    >
        <div 
            class="relative max-w-4xl max-h-[90vh] w-full"
            on:click|stopPropagation={() => {}}
            role="presentation"
        >
            <!-- Close button -->
            <button 
                class="absolute top-4 right-4 text-white text-xl font-bold p-2 hover:text-gray-300 z-20"
                on:click={closeOverlay}
                aria-label="Close image viewer"
            >
                ×
            </button>
            
            <!-- Navigation buttons -->
            {#if images.length > 1}
                <!-- Previous button -->
                <button 
                    class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 z-20"
                    on:click|stopPropagation={navigatePrevious}
                    aria-label="Previous image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <!-- Next button -->
                <button 
                    class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 z-20"
                    on:click|stopPropagation={navigateNext}
                    aria-label="Next image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                
                <!-- Image counter -->
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full z-20">
                    {currentIndex + 1} / {images.length}
                </div>
            {/if}
            
            <!-- Image -->
            <img 
                src={selectedImage} 
                alt="Full size" 
                class="max-h-[90vh] max-w-full object-contain mx-auto"
            />
        </div>
    </div>
{/if}
