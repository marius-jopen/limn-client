<script>
    import { generateImage } from '../../lib/api';

    let generatedImageUrl = '';
    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };

    async function handleGenerateImage() {
        try {
            generatedImageUrl = await generateImage(imageRequest);
        } catch (error) {
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <h1 class="pb-4">Generate Image 1111 RunPod Pod</h1>
    <input
        class="text-input"
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />
    <button class="button" on:click={handleGenerateImage}>Generate</button>
    
    {#if generatedImageUrl}
        <img class="pt-4" src={`http://localhost:4000${generatedImageUrl}`} alt="Generated Image" />
    {/if}
</main>
