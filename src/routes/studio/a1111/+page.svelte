<script>
    import A1111Run from '$lib/runpod/api/A1111Run.svelte';  
    import Gallery from '$lib/supabase/studio/basic/Gallery.svelte';
    import UI_CONFIG from '$lib/workflows/a1111/A1111TestConfig.json';
    import WORKFLOW from '$lib/workflows/a1111/A1111Test.json';
    import StatusTable from '$lib/runpod/studio/basic/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/studio/basic/components/LogViewer.svelte';
    import PreviewImages from '$lib/runpod/studio/basic/components/PreviewImages.svelte';
</script>

<div class="px-4 pt-16">
    <h1>
        A1111
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <A1111Run 
                service="a1111" 
                workflow_name="a1111-test"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />

            <StatusTable 
                workflow_name="a1111-test"
                label="A1111 Status" 
                id="a1111-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages />
            <Gallery 
                type={["uploaded", "generated"]} 
                workflow_names={["a1111-test"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>