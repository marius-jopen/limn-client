<script>
    import { createEventDispatcher } from 'svelte';
    
    const SERVER_URL = import.meta.env.SERVER_URL || 'http://localhost:4000/api';
    const dispatch = createEventDispatcher();
    
    export let prefix = '';
    export let refreshTrigger = 0;

    let images = [];
    let error = null;
    
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

    async function handleImageClick(imageUrl) {
        try {
            const relativePath = imageUrl.replace(SERVER_URL + '/output', '');
            const parameterUrl = `${SERVER_URL}/output${relativePath.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '.txt')}`;
            
            const response = await fetch(parameterUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load parameters: ${response.statusText}`);
            }
            
            const textContent = await response.text();
            const parameters = JSON.parse(textContent);
            
            dispatch('parameterSelect', parameters);
        } catch (err) {
            console.error('Error loading parameters:', err);
        }
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
            <img 
                class="rounded-md cursor-pointer" 
                src={image} 
                alt="Generated image" 
                on:click={() => handleImageClick(image)}
            />
        {/each}
    </div>
</div>