<script>
    import { API_URLS } from '../../lib/config';
    import ImageGallery from '../../lib/imageGallery.svelte';

    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };

    let galleryRefreshTimestamp = 0;
    
    async function generateImage() {
        try {
            const response = await fetch(API_URLS.server + "/generate-image-1111-runpod-serverless", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageRequest)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            galleryRefreshTimestamp = Date.now();
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <div class="border-b border-gray-200 pb-4 mb-8 w-full">
        <h1 class="pb-4">
            Generate Image 1111 RunPod Serverless
        </h1>
    </div>

    <input
        class="text-input"
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />
    <button class="button" on:click={generateImage}>Generate</button>
    
    <ImageGallery prefix="image-1111-runpod-serverless" refreshTrigger={galleryRefreshTimestamp} />
</main>