<script>
    import Header from '$lib/layout/header.svelte';
    import { imageDefaultParams } from '$lib/parameters/imageParameters';
    import { generateImage } from '$lib/api/imageGeneration';
    import ImageGallery from '$lib/image-gallery/imageGallery.svelte';
    import ImageControl from '$lib/controls/ImageControl.svelte';
    import EndpointSelector from '$lib/controls/EndpointSelector.svelte';
    import { user } from '$lib/stores/auth';

    let galleryRefreshTimestamp = 0;
    let selectedEndpoint = 'generate-image-1111-runpod-serverless';
    
    async function handleGenerateImage() {
        try {
            const currentUser = $user;
            if (!currentUser) {
                alert('Please log in to generate images');
                return;
            }
            
            await generateImage(selectedEndpoint, imageDefaultParams, currentUser.id);
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

<main class="md:flex gap-8">
    <div class="pl-8 pr-8 md:pr-0 md:w-3/5 md:h-screen overflow-y-scroll">
        <Header text="Generate Image 1111" />

        <div class="flex flex-col md:flex-row gap-4">
            <button class="button md:w-1/2" on:click={handleGenerateImage}>
                Generate
            </button>
            
            <EndpointSelector bind:selectedEndpoint />
        </div>
 
        <ImageControl {imageDefaultParams} />
    </div>

    <div class="pl-8 md:pl-0 pr-8 md:w-2/5 md:h-screen overflow-y-scroll">
        <ImageGallery 
            prefix="image-1111-runpod-serverless" 
            refreshTrigger={galleryRefreshTimestamp}
            on:parameterSelect={handleParameterSelect}
        />
    </div>
</main>