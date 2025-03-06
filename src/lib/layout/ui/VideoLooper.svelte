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
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    
    // Props
    export let images: ImageInput[] = [];
    export let fps: number = 15;
    export let autoPlay: boolean = true;
    export let showControls: boolean = true;
    export let aspectRatio: 'video' | 'square' = 'video';
    export let useBunnyCdn: boolean = true;
    
    // State
    let currentIndex = 0;
    let animationInterval: ReturnType<typeof setInterval> | null = null;
    let isPlaying = false; // Initialize as false, will be set to true in onMount
    
    // Calculate the interval in milliseconds based on FPS
    let intervalMs = 1000 / fps;
    $: intervalMs = 1000 / fps;
    
    // Helper function to get image URL from image object or string
    function getImageUrl(image: ImageInput): string {
        if (!image) return '';
        const url = typeof image === 'object' ? image.url : image;
        return url ? (useBunnyCdn ? transformToBunnyUrl(url) : url) : '';
    }
    
    // Function to check if an image URL is valid
    function isValidImageUrl(url: string): boolean {
        return !!url && url.trim() !== '';
    }
    
    // Start the animation loop
    function startAnimation() {
        if (animationInterval) clearInterval(animationInterval);
        
        if (images.length <= 1) return;
        
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
    
    // Go to a specific frame
    function goToFrame(index: number) {
        if (index >= 0 && index < images.length) {
            currentIndex = index;
        }
    }
    
    // Go to the next frame
    function nextFrame() {
        currentIndex = (currentIndex + 1) % images.length;
    }
    
    // Go to the previous frame
    function prevFrame() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
    }
    
    // Start animation on mount if autoPlay is true
    onMount(() => {
        // Always start from the first frame
        currentIndex = 0;
        
        // Start animation if autoPlay is true and there are enough images
        if (autoPlay && images.length > 1) {
            startAnimation();
        }
    });
    
    // Clean up on component destruction
    onDestroy(() => {
        if (animationInterval) {
            clearInterval(animationInterval);
        }
    });
    
    // Watch for changes to the images array or autoPlay
    $: {
        // If images array changes, reset to first frame
        if (images.length > 0) {
            currentIndex = 0;
        }
        
        // Handle autoplay logic
        if (images.length > 1) {
            if (autoPlay && !animationInterval) {
                startAnimation();
            } else if (!autoPlay && animationInterval) {
                stopAnimation();
            }
        } else {
            // If there's only one image or no images, stop the animation
            stopAnimation();
        }
    }
</script>

<div class="video-looper relative">
    <!-- Current image display -->
    <div class={`${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} bg-black relative overflow-hidden`}>
        {#if images.length > 0 && isValidImageUrl(getImageUrl(images[currentIndex]))}
            <img 
                src={getImageUrl(images[currentIndex])} 
                alt="Animation frame" 
                class="w-full h-full object-contain"
            />
        {:else}
            <div class="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="2" y1="7" x2="7" y2="7"></line>
                    <line x1="2" y1="17" x2="7" y2="17"></line>
                    <line x1="17" y1="17" x2="22" y2="17"></line>
                    <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
            </div>
        {/if}
        
        <!-- Frame counter -->
        {#if images.length > 0}
            <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {currentIndex + 1} / {images.length}
            </div>
        {/if}
    </div>
    
    <!-- Controls -->
    {#if showControls && images.length > 1}
        <div class="flex items-center justify-between bg-gray-800 text-white p-2">
            <button 
                class="p-1 hover:bg-gray-700 rounded"
                on:click={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {#if isPlaying}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                {/if}
            </button>
            
            <div class="flex items-center space-x-2">
                <button 
                    class="p-1 hover:bg-gray-700 rounded"
                    on:click={prevFrame}
                    aria-label="Previous frame"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <button 
                    class="p-1 hover:bg-gray-700 rounded"
                    on:click={nextFrame}
                    aria-label="Next frame"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            
            <div class="text-sm">
                FPS: {fps}
            </div>
        </div>
    {/if}
</div>