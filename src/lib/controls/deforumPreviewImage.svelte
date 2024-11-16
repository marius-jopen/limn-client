<script>
    import { generateImage } from '$lib/api/videoGeneration';

    export let basePrompt = '';  // These props should be passed correctly
    export let globalPositivePrompt = '';
    export let globalNegativePrompt = '';
    export let negativePrompt = '';

    let generatedImageUrl = '';
    let showFullscreen = false;

    async function handleGenerateImage() {
        try {
            // Construct the final prompt with global prompts
            const fullPrompt = `${globalPositivePrompt ? `${globalPositivePrompt}, ` : ''}${basePrompt}`;
            const fullNegativePrompt = `${negativePrompt ? `${negativePrompt} ` : ''}${globalNegativePrompt}`;

            const imageRequest = {
                prompt: fullPrompt,
                negative_prompt: fullNegativePrompt,
                steps: 20,
                width: 1024,
                height: 1024
            };

            console.log("Generated Image Request:", imageRequest); // Debugging log

            generatedImageUrl = await generateImage(imageRequest);
        } catch (error) {
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }

    function toggleFullscreen() {
        showFullscreen = !showFullscreen;
    }
</script>

<div class="flex h-full gap-1">
    <button class="mr-2 button" on:click={handleGenerateImage}>Generate Preview</button>

    {#if generatedImageUrl}
        <img class="h-10 w-10 rounded-xl cursor-pointer" src={`http://localhost:4000${generatedImageUrl}`} alt="Generated Image" on:click={toggleFullscreen} />
    {/if}
</div>

{#if showFullscreen}
    <div class="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
        <button class="absolute top-2 right-2 text-black bg-opacity-60 p-2 rounded-full text-xl" on:click={toggleFullscreen}>✖</button>
        <div class="relative">
            <img src={`http://localhost:4000${generatedImageUrl}`} alt="Generated Image" class="rounded-xl max-w-full max-h-full" />
        </div>
    </div>
{/if}
