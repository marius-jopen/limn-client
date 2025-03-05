<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import DeforumRun from '$lib/runpod/DeforumRun.svelte';  
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicInitConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/Cancel.svelte';
    import StatusTable from '$lib/runpod/ui/StatusTable.svelte';
    import LogViewer from '$lib/runpod/ui/LogViewer.svelte';
    import PreviewDeforum from '$lib/runpod/ui/PreviewDeforum.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';

    export let data: PageData;

    $: if (data.imageId) {
        $runState = { ...$runState, imageId: data.imageId };
    }
</script>


<div class="p-4">
    <h1>
        Deforum Init
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <DeforumRun 
                workflow_name="deforum-init"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />
            <Cancel />

            <StatusTable 
                workflow_name="deforum-init"
                label="Deforum Status" 
                id="deforum-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewDeforum />
            <GalleryDeforumVideos workflow_names={["deforum-init", "deforum-basic"]} />
            <GalleryImages 
                type={["uploaded", "generated"]} 
                workflow_names={["deforum-init", "deforum-basic"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>