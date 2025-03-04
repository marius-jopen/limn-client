<script>
    import ComfyuiRun from '$lib/runpod/ComfyuiRun.svelte';  
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import HealthCheck from '$lib/runpod/Health.svelte';
    import UI_CONFIG from '$lib/workflows/comfyui/ComfyuiFluxConfig.json';
    import WORKFLOW from '$lib/workflows/comfyui/ComfyuiFlux.json';

    import StatusTable from '$lib/runpod/ui/StatusTable.svelte';
    import LogViewer from '$lib/runpod/ui/LogViewer.svelte';
    import JsonViewer from '$lib/runpod/ui/JsonViewer.svelte';
    import PreviewImages from '$lib/runpod/ui/PreviewImages.svelte';
    // import { runState } from '$lib/runpod/helper/StoreRun.js';
</script>


<div class="p-4">
    <h1>ComfyUI Flux</h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <ComfyuiRun 
            service="comfyui" 
            workflow_name="comfyui-flux"
            ui_config={UI_CONFIG}
            workflow={WORKFLOW}
            />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages />
        </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div>
            <h2>Status</h2>
            <StatusTable 
                service="comfyui" 
                label="ComfyUI Flux Status" 
                id="comfyui-flux-status" 
            />
        </div>

        <!-- <HealthCheck service="comfyui" /> -->
    </div>
    
    <div class="flex gap-4 flex-col md:flex-row">
        <LogViewer id="log-viewer" label="Generation Logs" />
        <JsonViewer label="Complete Response" />
    </div>

    <!-- <div class="flex gap-4 flex-col md:flex-row">
        <LogViewer id="log-viewer" label="Generation Logs" {logs} {status} {runpodStatus} />
        <JsonViewer label="Complete Response" data={runpodStatus} />
    </div> -->
    
    <GalleryImages type="uploaded" />
    <GalleryImages workflow_name="comfyui-flux" />
</div>