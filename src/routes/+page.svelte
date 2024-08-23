<script>
    let prompt = '';
    let generatedImageUrl = '';
    
    async function generateImage() {
        const response = await fetch('http://localhost:4000/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        generatedImageUrl = data.imageUrl; // Adjusted to match the response from your server
    }
</script>

<main>
    <h1>Stable Diffusion Image Generator</h1>
    <input
        type="text"
        bind:value={prompt}
        placeholder="Enter your prompt"
    />
    <button on:click={generateImage}>Generate</button>
    
    {#if generatedImageUrl}
        <img src={generatedImageUrl} alt="Generated Image" />
    {/if}
</main>

<style>
    main {
        text-align: center;
        margin: 2rem auto;
        max-width: 600px;
    }
    input {
        width: 100%;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
    }
    img {
        margin-top: 2rem;
        max-width: 100%;
        height: auto;
    }
</style>
