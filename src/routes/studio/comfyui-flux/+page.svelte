<script>
    import ComfyuiRun from '$lib/runpod/api/ComfyuiRun.svelte';  
    import Gallery from '$lib/supabase/studio/basic/Gallery.svelte';
    import UI_CONFIG from '$lib/workflows/comfyui/ComfyuiFluxConfig.json';
    import WORKFLOW from '$lib/workflows/comfyui/ComfyuiFlux.json';
    import StatusTable from '$lib/runpod/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/components/LogViewer.svelte';
    import PreviewImages from '$lib/runpod/components/PreviewImages.svelte';
</script>

<div class="p-4">
    <h1>
        ComfyUI Flux
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <ComfyuiRun 
                service="comfyui" 
                workflow_name="comfyui-flux"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />

            <StatusTable 
                workflow_name="comfyui-flux"
                label="ComfyUi Flux Status" 
                id="comfyui-flux-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages />
            <Gallery 
                type={["uploaded", "generated"]} 
                workflow_names={["comfyui-flux"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>