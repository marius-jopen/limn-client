<script>
    import Header from '$lib/layout/header.svelte';
    import { imageDefaultParams } from '$lib/parameters/imageParameters';
    import { generateImage } from '$lib/api/imageGeneration';
    import ImageGallery from '$lib/previews/imageGallery.svelte';
    import ImageControl from '$lib/controls/ImageControl.svelte';
    import EndpointSelector from '$lib/controls/EndpointSelector.svelte';

    let galleryRefreshTimestamp = 0;
    let selectedEndpoint = 'generate-image-1111-runpod-serverless';
    
    async function handleGenerateImage() {
        try {
            await generateImage(selectedEndpoint, imageDefaultParams);
            galleryRefreshTimestamp = Date.now();
        } catch (error) {
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }

    function handleParameterSelect(event) {
        const parameters = event.detail.parameters;
        Object.keys(parameters).forEach(key => {
            imageDefaultParams[key] = parameters[key];
        });
    }
</script>

<main class="flex gap-8">
    <div class="pl-8 w-3/5 h-screen overflow-y-scroll">
        <Header text="Generate Image 1111" />

        <div class="flex gap-4">
            <button class="button w-1/2" on:click={handleGenerateImage}>
                Generate
            </button>
            
            <EndpointSelector bind:selectedEndpoint />
        </div>
 
        <ImageControl {imageDefaultParams} />
    </div>

    <div class="pr-8 w-2/5 h-screen overflow-y-scroll">
        <ImageGallery 
            prefix="image-1111-runpod-serverless" 
            refreshTrigger={galleryRefreshTimestamp}
            on:parameterSelect={handleParameterSelect}
        />
    </div>
</main>