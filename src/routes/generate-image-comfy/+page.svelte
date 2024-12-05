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
    let userPrompt = '';
    let userNegativePrompt = '';
    
    async function handleGenerateImage() {
        try {
            const currentUser = $user;
            if (!currentUser) {
                alert('Please log in to generate images');
                return;
            }

            const modifiedWorkflow = JSON.parse(JSON.stringify(comfyUIDefaultWorkflow));
            
            modifiedWorkflow['6'].inputs.text = modifiedWorkflow['6'].inputs.text.replace('{{COMFYUI_PROMPT}}', userPrompt);
            modifiedWorkflow['7'].inputs.text = modifiedWorkflow['7'].inputs.text.replace('{{COMFYUI_NEGATIVE_PROMPT}}', userNegativePrompt);
            console.log('Modified workflow:', modifiedWorkflow);
            
            await generateImage(selectedEndpoint, modifiedWorkflow, currentUser.id);
            galleryRefreshTimestamp = Date.now();
        } catch (error) {
            console.error('Error:', error);
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
        <Header text="Generate Image ComfyUI on RunPod Serverless" />

        <div class="flex flex-col md:flex-row gap-4">
            <input
                type="text"
                bind:value={userPrompt}
                placeholder="Enter your prompt..."
                class="input w-full md:w-1/2"
            />

            <input
                type="text"
                bind:value={userNegativePrompt}
                placeholder="Enter your negative prompt..."
                class="input w-full md:w-1/2"
            />
            <button class="button md:w-1/2" on:click={handleGenerateImage}>
                Generate
            </button>
        </div>
 
        <!-- <ImageControl {imageDefaultParams} /> -->
    </div>

    <div class="px-4 md:px-8 md:w-2/5 md:h-screen overflow-y-scroll">
        <ImageGallery 
            prefix="image-comfy-runpod-serverless" 
            refreshTrigger={galleryRefreshTimestamp}
            on:parameterSelect={handleParameterSelect}
        />
    </div>
</main>