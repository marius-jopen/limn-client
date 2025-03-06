<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import DeforumRun from '$lib/runpod/DeforumRun.svelte';  
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumLimnInitConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumLimn.json';
    import Cancel from '$lib/runpod/Cancel.svelte';
    import StatusTable from '$lib/runpod/ui/StatusTable.svelte';
    import LogViewer from '$lib/runpod/ui/LogViewer.svelte';
    import PreviewVideo from '$lib/runpod/ui/PreviewVideo.svelte';
    import PreviewImages from '$lib/runpod/ui/PreviewImages.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';

    export let data: PageData;

    $: if (data.imageId) {
        $runState = { ...$runState, imageId: data.imageId };
    }
</script>

<div class="p-4">
    <h1>
        Deforum Limn Init
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <DeforumRun 
                workflow_name="deforum-limn-init"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />
            <Cancel />

            <StatusTable 
                workflow_name="deforum-limn-init"
                label="Deforum Init Status" 
                id="deforum-limn-init-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewVideo />
            <PreviewImages />
            <GalleryDeforumVideos workflow_names={["deforum-limn-init", "deforum-basic"]} />
            <GalleryImages 
                type={["uploaded", "generated"]} 
                workflow_names={["deforum-limn-init", "deforum-basic"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>