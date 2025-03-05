<script context="module" lang="ts">
    // Define types for the image object
    export type ImageObject = {
        url: string;
        // Add other potential properties here if needed
    };

    export type ImageInput = ImageObject | string;
</script>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    // Props
    export let images: ImageInput[] = [];
    export let fps: number = 15;
    export let autoPlay: boolean = true;
    export let showControls: boolean = true;
    export let aspectRatio: 'video' | 'square' = 'video';
    
    // State
    let currentIndex = 0;
    let animationInterval: ReturnType<typeof setInterval> | null = null;
    let isPlaying = autoPlay;
    
    // Calculate the interval in milliseconds based on FPS
    $: intervalMs = 1000 / fps;
    
    // Helper function to get image URL from image object or string
    function getImageUrl(image: ImageInput): string {
        return typeof image === 'object' ? image.url : image;
    }
    
    // Start the animation loop
    function startAnimation() {
        if (animationInterval) clearInterval(animationInterval);
        
        isPlaying = true;
        animationInterval = setInterval(() => {
            // Move to the next image, loop back to the beginning if at the end
            currentIndex = (currentIndex + 1) % images.length;
        }, intervalMs);
    }
    
    // Stop the animation loop
    function stopAnimation() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        isPlaying = false;
    }
    
    // Toggle play/pause
    function togglePlayPause() {
        if (isPlaying) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }
    
    // Go to previous frame
    function prevFrame() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
    }
    
    // Go to next frame
    function nextFrame() {
        currentIndex = (currentIndex + 1) % images.length;
    }
    
    // Start animation when component mounts if autoPlay is true
    onMount(() => {
        if (autoPlay && images.length > 1) {
            startAnimation();
        }
    });
    
    // Clean up interval when component is destroyed
    onDestroy(() => {
        if (animationInterval) {
            clearInterval(animationInterval);
        }
    });
    
    // Watch for changes in images array or FPS
    $: {
        if (images.length > 1 && isPlaying) {
            // Restart animation with new interval if FPS changes
            startAnimation();
        } else if (images.length <= 1 && animationInterval) {
            // Stop animation if there are not enough images
            stopAnimation();
        }
    }
</script>

{#if images.length > 0}
    <div class="video-looper relative">
        <!-- Current image display -->
        <div class={`${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} bg-black relative overflow-hidden`}>
            <img 
                src={getImageUrl(images[currentIndex])} 
                alt="Animation frame" 
                class="w-full h-full object-contain"
            />
            
            <!-- Frame counter -->
            <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
        
        <!-- Controls -->
        {#if showControls && images.length > 1}
            <div class="flex items-center justify-center gap-2 mb-2 p-2 bg-gray-100 rounded">
                <!-- Previous frame button -->
                <button 
                    class="p-2 rounded-full hover:bg-gray-200"
                    on:click={prevFrame}
                    aria-label="Previous frame"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <!-- Play/Pause button -->
                <button 
                    class="p-2 rounded-full hover:bg-gray-200"
                    on:click={togglePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {#if isPlaying}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    {/if}
                </button>
                
                <!-- Next frame button -->
                <button 
                    class="p-2 rounded-full hover:bg-gray-200"
                    on:click={nextFrame}
                    aria-label="Next frame"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                
                <!-- FPS indicator -->
                <div class="ml-4 text-sm text-gray-700">
                    {fps} FPS
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div class={`${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} bg-gray-200 flex items-center justify-center text-gray-500`}>
        No images available
    </div>
{/if}