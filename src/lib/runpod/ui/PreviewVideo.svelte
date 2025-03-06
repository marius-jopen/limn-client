<script lang="ts">
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import VideoLooper from '$lib/layout/ui/VideoLooper.svelte';
    import type { ImageInput, ImageObject } from '$lib/layout/ui/VideoLooper.svelte';

    // DEFINE VARIABLES

    // Get images from runState store
    // Images are stored directly at the top level of the runState store object:
    // runState = { service, workflow_name, statusFields, logs, status, runpodStatus, images, values }
    let images: ImageInput[] = [];
    let filteredImages: ImageInput[] = [];
    
    // Props
    export let useBunnyCdn: boolean = false;
    
    // Function to check if an image is valid
    function isValidImage(image: ImageInput): boolean {
        if (!image) return false;
        
        const url = typeof image === 'object' ? image.url : image;
        return !!url && url.trim() !== '';
    }
    
    // DEFINE REACTIVE VARIABLES

    // Subscribe to runState
    // When runState changes, update the images array
    $: {
        if ($runState) {
            images = $runState.images || [];
            // Filter out invalid images
            filteredImages = images.filter(isValidImage);
        }
    }
</script>

<div>
    <VideoLooper 
        images={filteredImages} 
        {useBunnyCdn}
        autoPlay={true}
    />
</div> 