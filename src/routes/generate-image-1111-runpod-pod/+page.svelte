<script>
    import Header from '$lib/layout/header.svelte';
    import { imageDefaultParams } from '$lib/parameters/imageParameters';
    import { generateImage } from '$lib/api/imageGeneration';
    import ImageGallery from '$lib/previews/imageGallery.svelte';
    import ImageControl from '$lib/controls/ImageControl.svelte';

    let galleryRefreshTimestamp = 0;
    
    async function handleGenerateImage() {
        try {
            await generateImage('generate-image-1111-runpod-pod', imageDefaultParams);
            galleryRefreshTimestamp = Date.now();
        } catch (error) {
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <Header text="Generate Image 1111 RunPod Serverless" />

    <ImageControl {imageDefaultParams} />

    <button class="button" on:click={handleGenerateImage}>
        Generate
    </button>
    
    <ImageGallery prefix="image-1111-runpod-pod" refreshTrigger={galleryRefreshTimestamp} />
</main>