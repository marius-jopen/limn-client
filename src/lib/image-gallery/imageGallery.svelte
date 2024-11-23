<script>
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    import ImageGrid from './ImageGrid.svelte';
    import ImagePreviewModal from './ImagePreviewModal.svelte';
    
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const dispatch = createEventDispatcher();
    
    export let prefix = '';
    export let refreshTrigger = 0;

    let images = [];
    let error = null;
    let selectedImage = null;
    let currentIndex = 0;
    
    async function fetchImages() {
        try {
            const userId = $user?.id;
            if (!userId) return;
            
            const response = await fetch(`${serverUrl}/output?userId=${userId}`);
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            const data = await response.json();
            images = data.images
                .filter(image => image.subfolder.includes(prefix))
                .filter(image => /\.(jpg|jpeg|png|gif|webp)$/i.test(image.image_url))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(image => ({
                    url: image.image_url,
                    name: image.image_name,
                    timestamp: image.timestamp,
                    parameters: image.parameters,
                    subfolder: image.subfolder
                }));
            
            error = null;
        } catch (err) {
            error = err.message;
            images = [];
        }
    }
    
    function handleParameterSelect(event) {
        dispatch('parameterSelect', event.detail);
    }
    
    function handleImageDeleted(event) {
        const deletedImageUrl = event.detail.image;
        images = images.filter(img => img.url !== deletedImageUrl);
    }

    function openPreview(image) {
        console.log('Opening preview with image:', image);
        selectedImage = image;
        currentIndex = images.findIndex(img => img === image);
    }

    function nextImage() {
        currentIndex = (currentIndex + 1) % images.length;
        selectedImage = images[currentIndex];
    }

    function previousImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        selectedImage = images[currentIndex];
    }

    $: if ($user) fetchImages();
    $: refreshTrigger, fetchImages();
</script>

<div class="image-gallery">
    {#if error}
        <div class="error">{error}</div>
    {/if}
    
    <ImageGrid 
        {images}
        on:click={e => openPreview(e.detail)}
        on:parameterSelect={handleParameterSelect}
        on:imageDeleted={handleImageDeleted}
    />

    {#if selectedImage}
        <ImagePreviewModal
            {selectedImage}
            on:next={nextImage}
            on:previous={previousImage}
            on:close={() => selectedImage = null}
        />
    {/if}
</div>
