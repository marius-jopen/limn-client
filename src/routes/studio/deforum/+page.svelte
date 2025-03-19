<script>
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
</script>

<div class="px-4 pt-16">
    <h1>
        Deforum
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
            <VideosDeforum workflow_names={["deforum-init", "deforum-basic"]} />
            <GalleryDeforum 
                type={["generated"]} 
                workflow_names={["deforum-init", "deforum-basic"]} 
                defaultImagesPerRow={8}
            />       
        </div>
    </div>
</div>