<script lang="ts">
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import GalleryBasic, { type ImageInput } from '$lib/layout/ui/GalleryBasic.svelte';
    import VideoLooper from '$lib/layout/ui/VideoLooper.svelte';

    // DEFINE TYPES

    // Define types for the image object
    // This is the type of the images array in the runState store
    type ImageObject = {
        url: string;
        // Add other potential properties here if needed
    };

    // Define the type for the images array
    type ImageInput = ImageObject | string;

    // DEFINE VARIABLES

    // Get images from runState store
    // Images are stored directly at the top level of the runState store object:
    // runState = { service, workflow_name, statusFields, logs, status, runpodStatus, images, values }
    let images: ImageInput[] = [];
    
    // DEFINE REACTIVE VARIABLES

    // Subscribe to runState
    // When runState changes, update the images array
    $: {
        if ($runState) {
            images = $runState.images || [];
        }
    }
</script>

<div class="h-full">
    <VideoLooper {images}  />
    <GalleryBasic 
        {images} 
        gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    />
</div> 