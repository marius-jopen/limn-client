<script>
    import { user } from '../../stores/auth';
    import DEFAULT_WORKFLOW from '../../workflows/comfyui/comfyui-test.json';
    import Button from '../../atomic-components/Button.svelte';
    import InputPrompt from '../../ui-components/InputPrompt.svelte';
    import InputNumber from '../../ui-components/InputNumber.svelte';
    import JsonViewer from '../../ui-components/JsonViewer.svelte';
    import ImageDisplay from '../../ui-components/ImageDisplay.svelte';
    import AdvancedLogViewer from '../../ui-components/AdvancedLogViewer.svelte';

    // Group related state variables
    const INITIAL_STATE = {
        status: 'Idle',
        error: null,
        result: null,
        jobId: null,
        imageUrl: null,
        runpodStatus: null,
        logs: []
    };

    // Default prompt constants
    const DEFAULT_USER_PROMPT = "beautiful lady, (freckles), big smile, brown hazel eyes, Ponytail, dark makeup, hyperdetailed photography, soft light, head and shoulders portrait, cover";
    const DEFAULT_NEGATIVE_PROMPT = "bad eyes, cgi, airbrushed, plastic, deformed, watermark";

    // Initialize state
    let { status, error, result, jobId, imageUrl, runpodStatus, logs } = INITIAL_STATE;
    let userPrompt = DEFAULT_USER_PROMPT;
    let negativePrompt = DEFAULT_NEGATIVE_PROMPT;
    let seed = 1;
    let service = "comfyui"
    let workflow_name = "comfyui-test"

    $: user_id = $user?.id;

    // Constants
    const POLL_CONFIG = {
        maxAttempts: 360,
        interval: 500,
        estimatedJobTime: 30000 // 30 seconds
    };

    // Helper functions
    function resetState() {
        ({ status, error, result, jobId, imageUrl, runpodStatus, logs } = INITIAL_STATE);
    }

    // Workflow preparation function
    function prepareWorkflow(userPrompt, negativePrompt, seed) {
        const actualSeed = seed === -1 ? Math.floor(Math.random() * 1000000000) : seed;
        
        return JSON.parse(
            JSON.stringify(DEFAULT_WORKFLOW)
                .replace('"${INPUT_PROMPT}"', JSON.stringify(userPrompt))
                .replace('"${INPUT_NEGATIVEPROMPT}"', JSON.stringify(negativePrompt))
                .replace('"${SEED}"', actualSeed.toString())
        );
    }

    async function runWorkflow() {
        if (!userPrompt.trim()) {
            userPrompt = DEFAULT_USER_PROMPT;
        }
        if (!negativePrompt.trim()) {
            negativePrompt = DEFAULT_NEGATIVE_PROMPT;
        }

        resetState();
        status = 'Starting...';
        
        try {
            const workflowWithPrompt = prepareWorkflow(userPrompt, negativePrompt, seed);

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
                
                // Update logs
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
                    imageUrl = data.output?.[0]?.images?.[0]?.url;
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

<div class="px-4 pb-8">
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Run Workflow
        </h2>

        <InputPrompt
            id="prompt1"
            label="Prompt 1"
            bind:value={userPrompt}
        />

        <InputPrompt
            id="negative-prompt1"
            label="Negative prompt 1"
            bind:value={negativePrompt}
        />

        <InputNumber
            id="seed"
            label="Seed (-1 for random)"
            bind:value={seed}
        />

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
                <div class="font-medium p-3 border-b border-gray-200">Execution Time:</div>
                <div class="p-3 border-b border-gray-200">
                    {runpodStatus?.executionTime !== undefined ? `${runpodStatus.executionTime}ms` : 'No execution time available'}
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

        <ImageDisplay id="image-display" label="Generated Image" {imageUrl} />
    </div>
</div>