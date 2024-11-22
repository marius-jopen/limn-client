<script>
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    import ParameterCopyButton from '$lib/previews/ParameterCopyButton.svelte';
    import DeleteButton from '$lib/previews/DeleteImageButton.svelte';
    
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
</script>

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
            class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
            on:click={closePreview}
        >
            <div class=" max-w-[90vw] max-h-[90vh]">
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