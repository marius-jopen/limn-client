<script>
    import DEFAULT_WORKFLOW from '../../workflows/a1111/a1111-test.json';
    import Button from '../../atomic-components/Button.svelte';
    import InputPrompt from '../../ui-components/InputPrompt.svelte';
    import InputNumber from '../../ui-components/InputNumber.svelte';
    import InputText from '../../ui-components/InputText.svelte';
    import LogViewer from '../../ui-components/LogViewer.svelte';
    import ImageList from '../../ui-components/ImageList.svelte';
    import Status from '../../atomic-components/Status.svelte';
    import Error from '../../atomic-components/Error.svelte';
    import JobId from '../../atomic-components/JobId.svelte';
    import JsonViewer from '../../ui-components/JsonViewer.svelte';
    import ImageDisplay from '../../ui-components/ImageDisplay.svelte';

    // Group related state variables
    const INITIAL_STATE = {
        status: 'Idle',
        error: null,
        result: null,
        progress: 0,
        jobId: null,
        imageUrl: null,
        runpodStatus: null,
        logs: []
    };

    // Initialize state
    let { status, error, result, progress, jobId, imageUrl, runpodStatus, logs } = INITIAL_STATE;
    let userPrompt = "beautiful lady, (freckles), big smile, brown hazel eyes, Ponytail, dark makeup, hyperdetailed photography, soft light, head and shoulders portrait, cover";
    let negativePrompt = "bad eyes, cgi, airbrushed, plastic, deformed, watermark";
    let seed = 1; // Changed default from -1 to 1
    let username = "marius"; // Added username variable here

    // Constants
    const POLL_CONFIG = {
        maxAttempts: 360,
        interval: 500,
        estimatedJobTime: 30000 // 30 seconds
    };

    // Helper functions
    function resetState() {
        ({ status, error, result, progress, jobId, imageUrl, runpodStatus, logs } = INITIAL_STATE);
    }

    function updateProgress(data, attempt) {
        if (data.status === 'IN_QUEUE') {
            return 5;
        } else if (data.status === 'IN_PROGRESS') {
            if (data.executionTime) {
                return Math.min(90, (data.executionTime / POLL_CONFIG.estimatedJobTime) * 100);
            }
            return Math.min(90, 10 + (attempt * 2));
        }
        return data.status === 'COMPLETED' ? 100 : progress;
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString();
    }

    function formatProgressBar(message) {
        // Replace ANSI escape codes and carriage returns with HTML
        return message
            .replace(/\r/g, '\n')
            .replace(/\u001b\[\d+m/g, '');
    }

    async function pollJob(id) {
        for (let attempt = 0; attempt < POLL_CONFIG.maxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:4000/api/a1111-runpod-serverless-status/${id}`);
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

                progress = updateProgress(data, attempt);
                
                if (data.status === 'COMPLETED') {
                    result = data;
                    imageUrl = data.output?.[1]?.images?.[0]?.url;
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

    async function runWorkflow() {
        if (!userPrompt.trim()) {
            userPrompt = "beautiful lady, (freckles), big smile, brown hazel eyes, Ponytail, dark makeup, hyperdetailed photography, soft light, head and shoulders portrait, cover";
        }
        if (!negativePrompt.trim()) {
            negativePrompt = "bad eyes, cgi, airbrushed, plastic, deformed, watermark";
        }

        resetState();
        status = 'Starting...';
        
        try {
            const actualSeed = seed === -1 ? Math.floor(Math.random() * 1000000000) : seed;
            
            const workflowWithPrompt = JSON.parse(
                JSON.stringify(DEFAULT_WORKFLOW)
                    .replace('"${INPUT_PROMPT}"', JSON.stringify(userPrompt))
                    .replace('"${INPUT_NEGATIVEPROMPT}"', JSON.stringify(negativePrompt))
                    .replace('"${SEED}"', actualSeed.toString())
            );

            const response = await fetch('http://localhost:4000/api/a1111-runpod-serverless-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    input: { 
                        workflow: workflowWithPrompt,
                        user: username
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

        <Status {status} />
        <JobId {jobId} />
        <Error message={error} />   
        
        {#if logs.length > 0}
            <div class="mt-4">
                <h4 class="font-semibold mb-2">
                    Generation Logs:
                </h4>
                
                <div class="log-container bg-black text-green-400 p-4 rounded shadow-sm font-mono text-sm overflow-y-auto max-h-60">
                    {#if runpodStatus?.endpointId}
                        <div class="text-blue-400 mb-2">Endpoint ID: {runpodStatus.endpointId}</div>
                    {/if}

                    {#if runpodStatus?.workerId}
                        <div class="text-blue-400 mb-2">Worker ID: {runpodStatus.workerId}</div>
                    {/if}

                    {#each logs as log}
                        {#if log.type === 'worker'}
                            <div class="text-yellow-400 whitespace-pre-wrap leading-relaxed">
                                [{formatTimestamp(log.timestamp)}] [{log.level}] 

                                <span class="text-white">
                                    {formatProgressBar(log.message)}
                                </span>
                            </div>
                        {:else if log.type === 'error'}
                            <div class="text-red-400 whitespace-pre-wrap leading-relaxed">
                                Error: {log.message}
                            </div>
                        {:else}
                            <div class="text-green-400 whitespace-pre-wrap leading-relaxed">
                                {log.message}
                            </div>
                        {/if}
                    {/each}

                    {#if status !== 'Completed' && status !== 'Error'}
                        <div class="animate-pulse">
                            ▋
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        {#if runpodStatus}
            <div class="mt-4 p-4 bg-white rounded shadow-sm">
                <h4 class="font-semibold mb-2">
                    RunPod Status:
                </h4>

                <div class="text-sm">
                    <p>
                        Status: <span class="font-medium">{runpodStatus.status}</span>
                    </p>

                    {#if runpodStatus.delayTime !== undefined}
                        <p>
                            Delay Time: {runpodStatus.delayTime}ms
                        </p>
                    {/if}

                    {#if runpodStatus.executionTime !== undefined}
                        <p>
                            Execution Time: {runpodStatus.executionTime}ms
                        </p>
                    {/if}

                    {#if runpodStatus.error}
                        <p class="text-red-600">
                            Error: {runpodStatus.error}
                        </p>
                    {/if}

                    <JsonViewer label="Complete Response" data={runpodStatus} />
                </div>
            </div>
        {/if}
    </div>
    
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Output
        </h2>

        <ImageDisplay id="image-display" label="Generated Image" {imageUrl} />
    </div>
</div>