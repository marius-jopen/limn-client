<script>
    import DeforumRun from '$lib/runpod/DeforumRun.svelte';  
    import GalleryDeforumImages from '$lib/supabase/media/GalleryDeforumImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/Cancel.svelte';
    import StatusTable from '$lib/runpod/ui/StatusTable.svelte';
    import LogViewer from '$lib/runpod/ui/LogViewer.svelte';
    import PreviewVideo from '$lib/runpod/ui/PreviewVideo.svelte';
    import PreviewImages from '$lib/runpod/ui/PreviewImages.svelte';
</script>

<div class="p-4">
    <h1>
        Deforum Init
    </h1>

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
                label="Deforum Status" 
                id="deforum-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewVideo />
            <PreviewImages />
            <GalleryDeforumVideos workflow_names={["deforum-init", "deforum-basic"]} />
            <GalleryDeforumImages 
                type={["generated"]} 
                workflow_names={["deforum-init", "deforum-basic"]} 
                defaultImagesPerRow={8}
            />       
        </div>
    </div>
</div>