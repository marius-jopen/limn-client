<script>
    import Run from '../../../lib/runpod/run.svelte';  
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/health.svelte';
    import UI_CONFIG from '../../../lib/workflows/comfyui/config-comfyui-test.json';
    
    import StatusGrid from '../../../lib/ui-components/StatusGrid.svelte';
    import AdvancedLogViewer from '../../../lib/ui-components/AdvancedLogViewer.svelte';
    import JsonViewer from '../../../lib/ui-components/JsonViewer.svelte';
    import ImageList from '../../../lib/ui-components/ImageList.svelte';
    import { runState } from '../../../lib/runpod/helper/store-run.js';

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

    <HealthCheck service="comfyui" />
    
    <Run 
        service="comfyui" 
        workflow_name="comfyui-test"
        ui_config={UI_CONFIG}
        showStatus={false}
        showLogs={false}
        showJson={false}
        showImages={false}
    />
    
    <StatusGrid fields={statusFields} />
    <AdvancedLogViewer {logs} {status} {runpodStatus} />
    <JsonViewer label="Complete Response" data={runpodStatus} />
    <ImageList {images} />
    <ImagesByService workflow_name="comfyui-test" />
</div>