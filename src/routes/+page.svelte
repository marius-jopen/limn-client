<script>
    let generatedImageUrl = '';
    let imageRequest = {
        prompt: '',
        steps: 20,
        width: 1024,
        height: 1024
    };
    
    async function generateImage() {
        const response = await fetch('http://localhost:4000/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageRequest) // Send the entire object
        });
        
        const data = await response.json();
        generatedImageUrl = data.imageUrl; // Adjusted to match the response from your server
    }
</script>

<main>
    <h1>Stable Diffusion Image Generator</h1>
    <input
        type="text"
        bind:value={imageRequest.prompt}
        placeholder="Enter your prompt"
    />
    <button on:click={generateImage}>Generate</button>
    
    {#if generatedImageUrl}
        <img src={generatedImageUrl} alt="Generated Image" />
    {/if}
</main>