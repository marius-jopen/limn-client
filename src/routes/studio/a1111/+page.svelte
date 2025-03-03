<script>
    import A1111Run from '$lib/runpod/A1111Run.svelte';  
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import HealthCheck from '$lib/runpod/Health.svelte';
    import UI_CONFIG from '$lib/workflows/a1111/A1111TestConfig.json';
    import WORKFLOW from '$lib/workflows/a1111/A1111Test.json';

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
    <h1>A1111</h1>

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <A1111Run 
            service="a1111" 
            workflow_name="a1111-test"
            ui_config={UI_CONFIG}
            workflow={WORKFLOW}
            />
        </div>
        
        <div class="md:w-1/2">
            <PreviewImages {images} />
        </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div>
            <h2>Status</h2>
            <StatusTable fields={statusFields} />
        </div>

        <HealthCheck service="a1111" />
    </div>
    
    <div class="flex gap-4 flex-col md:flex-row">
        <LogViewer id="log-viewer" label="Generation Logs" {logs} {status} {runpodStatus} />
        <JsonViewer label="Complete Response" data={runpodStatus} />
    </div>
    
    <GalleryImages type="uploaded" />
    <GalleryImages workflow_name="a1111-test" />
</div>