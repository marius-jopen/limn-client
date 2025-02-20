<script>
    import Run from '../../../lib/runpod/ComfyuiRun.svelte';  
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/Health.svelte';
    import UI_CONFIG from '../../../lib/workflows/comfyui/config-comfyui-test.json';
    import WORKFLOW from '../../../lib/workflows/comfyui/comfyui-test.json';
    
    import StatusGrid from '../../../lib/runpod/ui/StatusGrid.svelte';
    import AdvancedLogViewer from '../../../lib/runpod/ui/AdvancedLogViewer.svelte';
    import JsonViewer from '../../../lib/runpod/ui/JsonViewer.svelte';
    import ImageList from '../../../lib/runpod/ui/LiveImageList.svelte';
    import { runState } from '../../../lib/runpod/helper/StoreRun.js';

    let statusFields, logs, status, runpodStatus, images;

    runState.subscribe(state => {
        statusFields = state.statusFields;
        logs = state.logs;
        status = state.status;
        runpodStatus = state.runpodStatus;
        images = state.images;
    });
</script>


<div class="p-4">
    <h1>ComfyUI</h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <Run 
            service="comfyui" 
            workflow_name="comfyui-test"
            ui_config={UI_CONFIG}
            workflow={WORKFLOW}
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
    <ImagesByService workflow_name="comfyui-test" />
    <HealthCheck service="comfyui" />
</div>