<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import FetchImage from '$lib/supabase/media/FetchImage.svelte';
    import Back from '$lib/layout/helper/Back.svelte';
    import DeforumRun from '$lib/runpod/DeforumRun.svelte';  
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
    import HealthCheck from '$lib/runpod/Health.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicInitConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/Cancel.svelte';
    import StatusTable from '$lib/runpod/ui/StatusTable.svelte';
    import LogViewer from '$lib/runpod/ui/LogViewer.svelte';
    import JsonViewer from '$lib/runpod/ui/JsonViewer.svelte';
    import PreviewDeforum from '$lib/runpod/ui/PreviewDeforum.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';

    export let data: PageData;

    let statusFields, logs, status, runpodStatus;
    let images = [];
    let currentJobId;

    $: if (data.imageId) {
        $runState = { ...$runState, imageId: data.imageId };
    }

    $: {
        if ($runState) {
            statusFields = $runState.statusFields;
            logs = $runState.logs;
            status = $runState.status;
            runpodStatus = $runState.runpodStatus;
            images = $runState.images || [];            
            currentJobId = statusFields?.find(field => field.label === "Job ID")?.value;
        }
    }
</script>

<div class="p-4">
    <h1>Deforum</h1>

    <Back />
    <FetchImage imageId={data.imageId} />

    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <DeforumRun 
            service="deforum" 
            workflow_name="deforum-test"
            ui_config={UI_CONFIG}
            workflow={WORKFLOW}
            />
            <Cancel jobId={currentJobId} />
        </div>
        
        <div class="md:w-1/2">
            <PreviewDeforum {images} />
        </div>
    </div>

    <StatusTable fields={statusFields} />
    
    <div class="flex gap-4 flex-col md:flex-row">
        <LogViewer id="log-viewer" label="Generation Logs" {logs} {status} {runpodStatus} />
        <JsonViewer label="Complete Response" data={runpodStatus} />
    </div>

    <HealthCheck service="deforum" />
    <HealthCheck service="cancel" />
    <GalleryDeforumVideos workflow_name="deforum-test" />
    <GalleryImages workflow_name="deforum-test" />
</div>
