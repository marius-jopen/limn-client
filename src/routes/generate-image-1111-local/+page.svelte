<script>
    import { API_URLS } from '../../lib/config';

    let generatedImageUrl = '';
    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };
    
    async function generateImage() {
        try {
            const response = await fetch(API_URLS.local + "/generate-image-1111-local", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageRequest)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            
            const data = await response.json();
            generatedImageUrl = data.imageUrl;
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <h1 class="pb-4">Generate Image 1111 Local</h1>
    <input
        class="text-input"
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />
    <button class="button" on:click={generateImage}>Generate</button>
    
    {#if generatedImageUrl}
        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img class="pt-4" src={`http://localhost:4000${generatedImageUrl}`} alt="Generated Image" />
    {/if}
</main>