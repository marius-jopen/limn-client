<script>
    import ComfyuiRun from '$lib/runpod/api/ComfyuiRun.svelte';  
    import Gallery from '$lib/supabase/media/Gallery.svelte';
    import UI_CONFIG from '$lib/workflows/comfyui/ComfyuiTestConfig.json';
    import WORKFLOW from '$lib/workflows/comfyui/ComfyuiTest.json';
    import StatusTable from '$lib/runpod/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/components/LogViewer.svelte';
    import PreviewImages from '$lib/runpod/components/PreviewImages.svelte';
</script>

<div class="p-4">
    <h1>
        ComfyUI
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <ComfyuiRun 
                service="comfyui" 
                workflow_name="comfyui-test"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />

            <StatusTable 
                workflow_name="comfyui-test"
                label="ComfyUi Status" 
                id="comfyui-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages />
            <Gallery 
                type={["uploaded", "generated"]} 
                workflow_names={["comfyui-test"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>