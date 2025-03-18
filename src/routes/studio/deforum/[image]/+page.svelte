<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import GalleryDeforum from '$lib/supabase/studio/basic/GalleryDeforum.svelte';
    import VideosDeforum from '$lib/supabase/studio/basic/VideosDeforum.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicInitConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/api/Cancel.svelte';
    import StatusTable from '$lib/runpod/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/components/LogViewer.svelte';
    import PreviewVideo from '$lib/runpod/components/PreviewVideo.svelte';
    import PreviewImages from '$lib/runpod/components/PreviewImages.svelte';
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
                label="Deforum Init Status" 
                id="deforum-init-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewVideo />
            <PreviewImages />
            <VideosDeforum workflow_names={["deforum-init", "deforum-basic"]} />
            <GalleryDeforum 
                type={["generated"]} 
                workflow_names={["deforum-init", "deforum-basic"]} 
                defaultImagesPerRow={8}
            />         
        </div>
    </div>
</div>