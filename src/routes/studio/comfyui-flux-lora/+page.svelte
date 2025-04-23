<script>
    import ComfyuiRun from '$lib/runpod/api/ComfyuiRun.svelte';  
    import Gallery from '$lib/supabase/studio/basic/Gallery.svelte';
    import UI_CONFIG from '$lib/workflows/comfyui/ComfyuiFluxLoraConfig.json';
    import WORKFLOW from '$lib/workflows/comfyui/ComfyuiFluxLora.json';
    import StatusTable from '$lib/runpod/studio/basic/components/StatusTable.svelte';
    import LogViewer from '$lib/runpod/studio/basic/components/LogViewer.svelte';
    import PreviewImages from '$lib/runpod/studio/basic/components/PreviewImages.svelte';
</script>

<div class="px-4 pt-16">
    <h1>
        ComfyUI Flux Lora
    </h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <ComfyuiRun 
                service="comfyui" 
                workflow_name="comfyui-flux-lora"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />

            <StatusTable 
                workflow_name="comfyui-flux-lora"
                label="ComfyUi Flux Lora Status" 
                id="comfyui-flux-lora-status" 
            />
            <LogViewer id="log-viewer" label="Generation Logs" />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages />
            <Gallery 
                type={["uploaded", "generated"]} 
                workflow_names={["comfyui-flux-lora"]} 
                defaultImagesPerRow={8}
            />        
        </div>
    </div>
</div>