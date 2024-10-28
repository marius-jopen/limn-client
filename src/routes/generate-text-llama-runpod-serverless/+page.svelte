<script>
    import { generateText } from '../../lib/api';

    let generatedText = '';
    let textRequest = {
        prompt: '',
        max_tokens: 100,  // Adjust based on the model's capability
    };
    
    async function generateTextRequest() {
        try {
            const data = await generateText(textRequest);
            generatedText = data.choices ? data.choices[0].text : 'No text generated';  // assuming the API response follows OpenAI's format
        } catch (error) {
            console.error('Error generating text:', error);
            alert('Failed to generate text. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <h1 class="pb-4">Generate Text with LLaMA on RunPod</h1>
    <input
        class="text-input"
        type="text"
        bind:value={textRequest.prompt}
        placeholder="Enter your text prompt"
    />
    <button class="button" on:click={generateTextRequest}>Generate Text</button>
    
    {#if generatedText}
        <div class="pt-4">
            <h2>Generated Text:</h2>
            <p>{generatedText}</p>
        </div>
    {/if}
</main>
