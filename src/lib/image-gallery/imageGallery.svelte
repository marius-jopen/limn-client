<script>
    /**
     * Image Gallery Component
     * 
     * This component provides a responsive gallery view for displaying and managing images.
     * 
     * Features:
     * - Displays a grid of user-generated images
     * - Supports image preview with modal view
     * - Navigation between images using arrow keys or on-screen buttons
     * - Image deletion functionality
     * - Parameter copy functionality for each image
     * - Automatic refresh when user state changes
     * - Filters images based on file extensions and optional prefix
     * 
     * Props:
     * - prefix: string - Optional filter to show only images containing this prefix
     * - refreshTrigger: number - Trigger to force gallery refresh
     * 
     * Events:
     * - parameterSelect: Dispatched when image parameters are selected
     */

    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    import ParameterCopyButton from '$lib/image-gallery/ParameterCopyButton.svelte';
    import DeleteButton from '$lib/image-gallery/DeleteImageButton.svelte';
    
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const dispatch = createEventDispatcher();
    
    export let prefix = '';
    export let refreshTrigger = 0;

    let images = [];
    let error = null;
    let selectedImage = null;
    
    async function fetchImages() {
        try {
            const userId = $user?.id;
            // console.log('Current user:', $user);
            // console.log('UserId:', userId);
            
            if (!userId) {
                // throw new Error('User not authenticated');
                // console.log('User not authenticated');
            }
            
            const response = await fetch(`${serverUrl}/output?userId=${userId}`);
            // console.log(`${VITE_SERVER_URL}/output?userId=${userId}`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            const filteredImages = data.images
                .filter(imageUrl => imageUrl.includes(prefix))
                .filter(imageUrl => /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl))
                .map(imageUrl => {
                    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                    return `${serverUrl}/output/${cleanPath}`;
                });
            
            images = filteredImages.reverse();
        } catch (err) {
            error = err.message;
            images = [];
        }
    }
    
    $: refreshTrigger, fetchImages();

    function handleParameterSelect(event) {
        dispatch('parameterSelect', event.detail);
    }
    
    function openPreview(image) {
        selectedImage = image;
        currentIndex = images.findIndex(img => img === image);
    }
    
    function closePreview() {
        selectedImage = null;
    }

    function handleImageDeleted(event) {
        const deletedImage = event.detail.image;
        images = images.filter(img => img !== deletedImage);
    }

    $: if ($user) {
        // console.log('User store updated:', $user);
        fetchImages();
    }

    let currentIndex = 0;

    function nextImage(event) {
        event.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        selectedImage = images[currentIndex];
    }

    function previousImage(event) {
        event.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        selectedImage = images[currentIndex];
    }

    // Add keyboard navigation
    function handleKeydown(event) {
        if (!selectedImage) return;
        
        if (event.key === 'ArrowRight') {
            nextImage(event);
        } else if (event.key === 'ArrowLeft') {
            previousImage(event);
        } else if (event.key === 'Escape') {
            closePreview();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="image-gallery">
    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}
    
    <div class="grid grid-cols-1 gap-4 my-8">
        {#each images as image}
            <div class="relative group">
                <img 
                    class="rounded-md w-full cursor-pointer" 
                    src={image} 
                    alt="Generated image" 
                    on:click={() => openPreview(image)}
                />

                <ParameterCopyButton 
                    {image} 
                    on:parameterSelect={handleParameterSelect}
                />

                <DeleteButton 
                    {image} 
                    on:imageDeleted={handleImageDeleted}
                />
            </div>
        {/each}
    </div>

    {#if selectedImage}
        <div 
            class="fixed inset-0 bg-black bg-opacity-85 z-50 flex items-center justify-center"
            on:click={closePreview}
        >
            <button
                class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl opacity-75 hover:opacity-100"
                on:click|stopPropagation={previousImage}
            >
                ‹
            </button>

            <button
                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl opacity-75 hover:opacity-100"
                on:click|stopPropagation={nextImage}
            >
                ›
            </button>

            <div class="max-w-[90vw] max-h-[90vh]">
                <button
                    class="absolute top-1 right-4 text-3xl text-white"
                    on:click|stopPropagation={closePreview}
                >
                    ×
                </button>

                <img 
                    src={selectedImage} 
                    alt="Preview" 
                    class="max-w-full max-h-[90vh] object-contain"
                    on:click|stopPropagation
                />
            </div>
        </div>
    {/if}
</div>