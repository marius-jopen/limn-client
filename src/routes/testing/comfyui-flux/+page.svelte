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
    import { runState } from '$lib/runpod/helper/StoreRun.js';

    let statusFields, logs, status, runpodStatus;
    let images = [];

    $: {
        if ($runState) {
            statusFields = $runState.statusFields;
            logs = $runState.logs;
            status = $runState.status;
            runpodStatus = $runState.runpodStatus;
            images = $runState.images || [];
        }
    }
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
            <PreviewImages {images} />
        </div>
    </div>

    <StatusTable fields={statusFields} />
    <LogViewer id="log-viewer" label="Generation Logs" {logs} {status} {runpodStatus} />
    <JsonViewer label="Complete Response" data={runpodStatus} />
    <GalleryImages workflow_name="comfyui-flux" />
    <HealthCheck service="comfyui" />
</div>