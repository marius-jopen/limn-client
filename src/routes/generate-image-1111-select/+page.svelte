<script>
    import { API_URLS } from '../../config';

    let selectedApiUrl = API_URLS.runpodPod; // Default to runpodPod
    let generatedImageUrl = '';
    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };

    async function generateImage() {
        try {
            const response = await fetch(selectedApiUrl, {
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
    <h1 class="pb-4">Generate Image 1111 Select</h1>
    
    <div class="pb-4 flex gap-4">
        <label>
            <input type="radio" bind:group={selectedApiUrl} value={API_URLS.runpodPod}>
            RunPod Pod
        </label>
        <label>
            <input type="radio" bind:group={selectedApiUrl} value={API_URLS.runpodServerless}>
            RunPod Serverless
        </label>
        <label>
            <input type="radio" bind:group={selectedApiUrl} value={API_URLS.local}>
            Local
        </label>
    </div>

    <input
        class="text-input"
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />
    <button class="button" on:click={generateImage}>Generate</button>
    
    {#if generatedImageUrl}
        <img class="pt-4" src={`http://localhost:4000${generatedImageUrl}`} alt="Generated Image" />
    {/if}
</main>
