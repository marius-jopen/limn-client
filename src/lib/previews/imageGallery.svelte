<script>
    import { createEventDispatcher } from 'svelte';
    import ParameterCopyButton from '$lib/previews/ParameterCopyButton.svelte';
    
    const SERVER_URL = import.meta.env.SERVER_URL || 'http://localhost:4000/api';
    const dispatch = createEventDispatcher();
    
    export let prefix = '';
    export let refreshTrigger = 0;

    let images = [];
    let error = null;
    let selectedImage = null;
    
    async function fetchImages() {
        try {
            const response = await fetch(SERVER_URL + "/output");
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            const filteredImages = data.images
                .filter(imageUrl => imageUrl.includes(prefix))
                .filter(imageUrl => /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl))
                .map(imageUrl => `${SERVER_URL}/output${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`);
            
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