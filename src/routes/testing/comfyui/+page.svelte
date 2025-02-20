<script>
    import Run from '../../../lib/runpod/run.svelte';  
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/health-check.svelte';
    
    // You can also extract these components if you want to use them separately
    import StatusGrid from '../../../lib/ui-components/StatusGrid.svelte';
    import AdvancedLogViewer from '../../../lib/ui-components/AdvancedLogViewer.svelte';
    import JsonViewer from '../../../lib/ui-components/JsonViewer.svelte';
    import ImageList from '../../../lib/ui-components/ImageList.svelte';
    import { runState } from '../../../lib/runpod/stores.js';

    // Subscribe to the store
    let statusFields, logs, status, runpodStatus, images;

    runState.subscribe(state => {
        statusFields = state.statusFields;
        logs = state.logs;
        status = state.status;
        runpodStatus = state.runpodStatus;
        images = state.images;
    });
</script>

<h1 class="px-4 py-4">
    ComfyUI
</h1>

<HealthCheck service="comfyui" />

<Run 
    service="comfyui" 
    workflow_name="comfyui-test"
    showStatus={false}
    showLogs={false}
    showJson={false}
    showImages={false}
/>

<!-- Now you can place these components wherever you want -->
<StatusGrid fields={statusFields} />
<AdvancedLogViewer {logs} {status} {runpodStatus} />
<JsonViewer label="Complete Response" data={runpodStatus} />
<ImageList id="image-list" label="Generated Images" {images} />
<ImagesByService service="comfyui" />