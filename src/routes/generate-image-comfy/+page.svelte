<script>
    import Header from '$lib/layout/header.svelte';
    import { comfyUIDefaultWorkflow } from '$lib/parameters/comfyuiDefaultWorkflow';
    import { generateImage } from '$lib/api/imageGeneration';
    import ImageGallery from '$lib/image-gallery/imageGallery.svelte';
    import ImageControl from '$lib/controls/ImageControl.svelte';
    import EndpointSelector from '$lib/controls/EndpointSelector.svelte';
    import { user } from '$lib/stores/auth';

    let galleryRefreshTimestamp = 0;
    let selectedEndpoint = 'generate-image-comfy-runpod-serverless';
    
    async function handleGenerateImage() {
        try {
            const currentUser = $user;
            if (!currentUser) {
                alert('Please log in to generate images');
                return;
            }

            console.log('imageDefaultParams', comfyUIDefaultWorkflow);
            
            await generateImage(selectedEndpoint, comfyUIDefaultWorkflow, currentUser.id);
            galleryRefreshTimestamp = Date.now();
        } catch (error) {
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }

    function handleParameterSelect(event) {
        // const parameters = event.detail.parameters.input;
        // Object.keys(parameters).forEach(key => {
        //     if (key !== 'userId') {
        //         imageDefaultParams[key] = parameters[key];
        //     }
        // });
        
        // console.log('Updated parameters:', imageDefaultParams);
    }
</script>

<main class="md:flex gap-8">
    <div class="px-4 md:px-8 md:pr-0 md:w-3/5 md:h-screen overflow-y-scroll">
        <Header text="Generate Image 1111" />

        <div class="flex flex-col md:flex-row gap-4">
            <button class="button md:w-1/2" on:click={handleGenerateImage}>
                Generate
            </button>
            
            <!-- <EndpointSelector bind:selectedEndpoint /> -->
        </div>
 
        <!-- <ImageControl {imageDefaultParams} /> -->
    </div>

    <div class="px-4 md:px-8 md:w-2/5 md:h-screen overflow-y-scroll">
        <ImageGallery 
            prefix="image-1111-runpod-serverless" 
            refreshTrigger={galleryRefreshTimestamp}
            on:parameterSelect={handleParameterSelect}
        />
    </div>
</main>