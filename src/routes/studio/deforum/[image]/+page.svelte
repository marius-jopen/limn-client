<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import GalleryDeforum from '$lib/supabase/studio/basic/GalleryDeforum.svelte';
    import VideosDeforum from '$lib/supabase/studio/basic/VideosDeforum.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import StatusTable from '$lib/runpod/studio/basic/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/studio/basic/components/LogViewer.svelte';
    import PreviewVideo from '$lib/runpod/studio/basic/components/PreviewVideo.svelte';
    import PreviewImages from '$lib/runpod/studio/basic/components/PreviewImages.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';

    export let data: PageData;
    
    // Track the current effective image ID
    let effectiveImageId = data.imageId;
    
    // Reset state when navigating to a new image URL
    $: if ($page.url.pathname !== currentPath && data.imageId) {
        currentPath = $page.url.pathname;
        console.log('New route detected:', data.imageId);
        effectiveImageId = data.imageId;
        runState.set({ ...($runState || {}), imageId: data.imageId });
        selectedImageId.set(null); // Clear any previous selection
    }
    let currentPath = '';
    
    // Initialize on mount
    onMount(() => {
        currentPath = $page.url.pathname;
        if (data.imageId) {
            effectiveImageId = data.imageId;
            runState.set({ ...($runState || {}), imageId: data.imageId });
        }
    });
    
    // Handle user selecting an image via the gallery
    const unsubSelectedImage = selectedImageId.subscribe(newId => {
        if (newId) {
            console.log('User selected image:', newId);
            effectiveImageId = newId;
            runState.set({ ...($runState || {}), imageId: newId });
        }
    });
    
    onDestroy(unsubSelectedImage);
</script>

<div class="px-4 pt-16">
    <h1>Deforum from Image {effectiveImageId}</h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <DeforumRun 
                workflow_name="deforum-basic"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />
            <Cancel />
            <StatusTable 
                workflow_name="deforum-basic"
                label="Deforum basic Status" 
                id="deforum-basic-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewVideo />
            <PreviewImages />
            <VideosDeforum workflow_names={["deforum-basic"]} />
            <GalleryDeforum 
                type={["generated"]} 
                workflow_names={["deforum-basic"]} 
                defaultImagesPerRow={8}
            />         
        </div>
    </div>
</div>