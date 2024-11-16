<script>
    import { API_URLS } from '../lib/config.js';
    
    export let prefix = '';
    export let refreshTrigger = 0;

    let images = [];
    let error = null;
    
    async function fetchImages() {
        try {
            const response = await fetch(API_URLS.server + "/output");
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            const filteredImages = data.images
                .filter(imageUrl => imageUrl.includes(prefix))
                .map(imageUrl => `${API_URLS.server}/output/${imageUrl}`);
            
            images = filteredImages.reverse();
        } catch (err) {
            error = err.message;
            images = [];
        }
    }
    
    // Update reactive statement to explicitly watch refreshTrigger
    $: refreshTrigger, fetchImages();
</script>

<div class="image-gallery">
    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}
    
    <div class="grid grid-cols-3 gap-4 mt-8">
        {#each images as image}
            <img class="rounded-md" src={image} alt="Generated image" />
        {/each}
    </div>
</div>