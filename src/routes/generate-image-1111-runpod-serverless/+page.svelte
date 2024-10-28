<script>
    import { onMount } from 'svelte';
    import { API_URLS } from '../../lib/config';

    let generatedImages = [];  // Array to store all images
    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };
    
    async function loadImages() {
        try {
            const response = await fetch(`${API_URLS.server}/images-1111-runpod-serverless`);
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const data = await response.json();
            generatedImages = data.images.map(url => ({ url })).reverse();
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }
    
    async function generateImage() {
        try {
            await fetch(API_URLS.server + "/generate-image-1111-runpod-serverless", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(imageRequest)
            });
            
            // Reload images after a delay to allow for generation
            setTimeout(loadImages, 5000);
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image');
        }
    }

    onMount(loadImages);
</script>

<main>
    <h1 class="pb-4">
        Generate Image 1111 RunPod Serverless
    </h1>

    <input
        class="text-input"
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />

    <button class="button" on:click={generateImage}>Generate</button>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {#each generatedImages as image}
            <div class="border p-4 rounded">
                <img 
                    class="w-full" 
                    src={`${API_URLS.server}/output${image.url}`} 
                    alt="Generated image" 
                />
            </div>
        {/each}
    </div>
</main>
