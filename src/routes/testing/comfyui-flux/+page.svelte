<script>
    import Run from '../../../lib/runpod/run.svelte';  
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/health.svelte';
    import UI_CONFIG from '../../../lib/workflows/comfyui/config-comfyui-flux.json';
    
    import StatusGrid from '../../../lib/ui-components/StatusGrid.svelte';
    import AdvancedLogViewer from '../../../lib/runpod/components/AdvancedLogViewer.svelte';
    import JsonViewer from '../../../lib/ui-components/JsonViewer.svelte';
    import ImageList from '../../../lib/ui-components/ImageList.svelte';
    import { runState } from '../../../lib/runpod/helper/store-run.js';

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
            <Run 
            service="comfyui" 
            workflow_name="comfyui-flux"
            ui_config={UI_CONFIG}
            showStatus={false}
            showLogs={false}
            showJson={false}
            showImages={false}
            />
        </div>
        
        <div class="md:w-1/2">
            <ImageList {images} />
        </div>
    </div>

    <StatusGrid fields={statusFields} />
    <AdvancedLogViewer {logs} {status} {runpodStatus} />
    <JsonViewer label="Complete Response" data={runpodStatus} />
    <ImagesByService workflow_name="comfyui-flux" />
    <HealthCheck service="comfyui" />
</div>