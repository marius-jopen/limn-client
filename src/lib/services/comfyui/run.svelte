<script>
    import { user } from '../../stores/auth';
    import DEFAULT_WORKFLOW from '../../workflows/comfyui/comfyui-test.json';
    import UI_CONFIG from '../../workflows/comfyui/comfyui-test-uiconfig.json';
    import Button from '../../atoms/Button.svelte';
    import RunUI from '../../ui-components/run-ui.svelte';
    import JsonViewer from '../../ui-components/JsonViewer.svelte';
    import AdvancedLogViewer from '../../ui-components/AdvancedLogViewer.svelte';   
    import ImageList from '../../ui-components/ImageList.svelte';

    const INITIAL_STATE = {
        status: 'Idle',
        error: null,
        result: null,
        jobId: null,
        imageUrl: null,
        images: [],
        runpodStatus: null,
        logs: []
    };

    const POLL_CONFIG = {
        maxAttempts: 360,
        interval: 500,
        estimatedJobTime: 30000 // 30 seconds
    };

    let { status, error, result, jobId, imageUrl, images, runpodStatus, logs } = INITIAL_STATE;
    let values = Object.fromEntries(UI_CONFIG.map(field => [field.id, field.default]));
    
    export let service
    export let workflow_name
    
    $: user_id = $user?.id;

    function resetState() {
        ({ status, error, result, jobId, imageUrl, images, runpodStatus, logs } = INITIAL_STATE);
    }

    function prepareWorkflow(workflow, uiConfig, values) {
        let workflowStr = JSON.stringify(workflow);

        uiConfig.forEach(field => {
            const value = field.type === 'int' 
                ? (field.id === 'seed' && values[field.id] === -1 
                    ? Math.floor(Math.random() * 1000000000) 
                    : values[field.id])
                : JSON.stringify(values[field.id]);

            workflowStr = workflowStr.replace(
                `"${field.placeholder}"`, 
                field.type === 'int' ? value : value
            );
        });

        return JSON.parse(workflowStr);
    }

    async function runWorkflow() {
        resetState();
        status = 'Starting...';

        // Reset any empty string values to their defaults
        UI_CONFIG.forEach(field => {
            if (field.type === 'string' && !values[field.id]?.trim()) {
                values[field.id] = field.default;
            }
        });
        
        try {
            const workflowWithPrompt = prepareWorkflow(DEFAULT_WORKFLOW, UI_CONFIG, values);

            const response = await fetch('http://localhost:4000/api/comfyui-runpod-serverless-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    input: { 
                        workflow: workflowWithPrompt,
                        user: user_id
                    } 
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            jobId = data.data.id;
            
            await pollJob(jobId);
        } catch (err) {
            error = err.message;
            status = 'Error';
            result = null;
        }
    }

    async function pollJob(id) {
        for (let attempt = 0; attempt < POLL_CONFIG.maxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:4000/api/comfyui-runpod-serverless-status/${id}?userId=${user_id}&service=${service}&workflow=${workflow_name}`, {
                    headers: {
                        'user-id': user_id,
                        'service': service,
                        'workflow': workflow_name
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                runpodStatus = data;
                
                if (data.logs?.length > 0) {
                    const newLogs = data.logs.filter(log => !logs.includes(log));
                    if (newLogs.length > 0) {
                        logs = [...logs, ...newLogs];
                        queueMicrotask(() => {
                            document.querySelector('.log-container')?.scrollTo(0, Number.MAX_SAFE_INTEGER);
                        });
                    }
                }
                
                if (data.status === 'COMPLETED') {
                    result = data;
                    images = data.output?.[0]?.images || [];
                    imageUrl = images[0]?.url;
                    status = 'Completed';
                    return;
                }
                
                if (data.status === 'FAILED') {
                    throw new Error(`Job failed: ${JSON.stringify(data.error)}`);
                }

                status = data.status === 'IN_QUEUE' ? 'Queued' : 'Processing';
                await new Promise(resolve => setTimeout(resolve, POLL_CONFIG.interval));
            } catch (err) {
                error = err.message;
                status = 'Error';
                return;
            }
        }

        throw new Error('Timeout waiting for job completion');
    }
</script>

<div class="px-4 pb-0">
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>Run Workflow</h2>

        <RunUI UI={UI_CONFIG} bind:values />

        <Button
            onClick={runWorkflow}
            disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'}
            label="Generate"
        />
    </div>

    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Status & Logs
        </h2>

        <div class="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden bg-white divide-x divide-gray-200">
            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">User ID:</div>
                <div class="p-3 border-b border-gray-200">{user_id}</div>
            </div>
            
            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">Status:</div>
                <div class="p-3 border-b border-gray-200">{status || 'Idle'}</div>
            </div>

            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">RunPod Status:</div>
                <div class="p-3 border-b border-gray-200">{runpodStatus?.status || 'Not started'}</div>
            </div>

            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">Error:</div>
                <div class="p-3 border-b border-gray-200">{error || 'No Error'}</div>
            </div>

            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">Job ID:</div>
                <div class="p-3 border-b border-gray-200">{jobId || 'No JobID received'}</div>
            </div>

            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">Delay Time:</div>
                <div class="p-3 border-b border-gray-200">
                    {runpodStatus?.delayTime !== undefined ? `${runpodStatus.delayTime}ms` : 'No delay time available'}
                </div>
            </div>

            <div class="contents">
                <div class="font-medium p-3 border-b border-gray-200">Endpoint ID:</div>
                <div class="p-3 border-b border-gray-200">
                    {runpodStatus?.endpointId || 'No endpoint ID available'}
                </div>
            </div>

            <div class="contents">
                <div class="font-medium p-3">Worker ID:</div>
                <div class="p-3">
                    {runpodStatus?.workerId || 'No worker ID available'}
                </div>
            </div>
        </div>
        
        <AdvancedLogViewer 
            {logs}
            {status}
            {runpodStatus}
        />

        <JsonViewer label="Complete Response" data={runpodStatus} />
    </div>

    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Output
        </h2>

        <ImageList id="image-list" label="Generated Images" {images} />
    </div>
</div>