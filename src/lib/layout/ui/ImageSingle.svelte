<script context="module" lang="ts">
    // Define types for the image object
    export type ImageObject = {
        url: string;
        // Add other potential properties here if needed
    };

    export type ImageInput = ImageObject | string;
</script>

<script lang="ts">
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';

    // Props for the Gallery component
    export let images: ImageInput[] = [];
    export let gridCols: string = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    export let useBunnyCdn: boolean = true;
    
    // State for overlay
    let showOverlay = false;
    let selectedImage: string = '';
    let currentIndex = 0;

    // Helper function to get image URL from image object or string
    function getImageUrl(image: ImageInput): string {
        const url = typeof image === 'object' ? image.url : image;
        return url ? (useBunnyCdn ? transformToBunnyUrl(url) : url) : '';
    }

    // Function to check if an image URL is valid (not empty)
    function isValidImageUrl(url: string): boolean {
        return !!url && url.trim() !== '';
    }

    // Function to open overlay
    function openOverlay(imageUrl: string, index: number): void {
        if (!isValidImageUrl(imageUrl)) return;
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
            case 'Escape':
                closeOverlay();
                break;
            case 'ArrowLeft':
                navigatePrevious();
                break;
            case 'ArrowRight':
                navigateNext();
                break;
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="gallery-basic">
    <div class="max-w-xl mx-auto">
        {#if images.length > 0}
            {@const imageUrl = getImageUrl(images[0])}
            
            <div 
                class="aspect-square overflow-hidden cursor-pointer group relative rounded-lg"
                on:click={() => openOverlay(imageUrl, 0)}
                on:keydown={(e) => e.key === 'Enter' && openOverlay(imageUrl, 0)}
                tabindex="0"
                role="button"
                aria-label="View full size image"
            >
                <img 
                    src={imageUrl} 
                    alt="Gallery image" 
                    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                />
            </div>
        {:else}
            <div class="aspect-square flex items-center justify-center bg-white rounded-lg">
                <div class="flex flex-col items-center justify-center">
                    <p class="text-4xl mb-2">🥕</p>
                    <p class="text-gray-500 text-lg">Generate a Wabi icon</p>
                </div>
            </div>
        {/if}
    </div>
    
    {#if showOverlay}
        <div 
            class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            on:click={closeOverlay}
            on:keydown={(e) => e.key === 'Escape' && closeOverlay()}
            role="button"
            tabindex="0"
        >
            <div 
                class="relative max-w-4xl max-h-[90vh] w-full"
                on:click|stopPropagation={() => {}}
                on:keydown|stopPropagation={() => {}}
                role="presentation"
            >
                <img 
                    src={selectedImage} 
                    alt="Full size image" 
                    class="max-w-full max-h-[90vh] object-contain mx-auto"
                />
                
                <!-- Close button -->
                <button 
                    class="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                    on:click|stopPropagation={closeOverlay}
                    aria-label="Close overlay"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    {/if}
</div>
