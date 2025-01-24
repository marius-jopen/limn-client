<script>
    import DEFAULT_WORKFLOW from '../../workflows/deforum-basic.json';

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
                const response = await fetch(`http://localhost:4000/api/deforum-runpod-serverless-status/${id}`);
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

            const response = await fetch('http://localhost:4000/api/deforum-runpod-serverless-run', {
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

<div class="p-4 rounded-lg bg-gray-100">
    <div class="flex flex-col gap-4 mb-4">
        <h1 class="text-xl font-bold">Deforum RunPod Workflow</h1>
        
        <!-- Prompt input section -->
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="prompt" class="font-medium">Enter your prompt:</label>
                <textarea
                    id="prompt"
                    bind:value={userPrompt}
                    placeholder="Describe what you want to generate..."
                    class="w-full p-2 rounded border border-gray-300 min-h-[100px] resize-y"
                ></textarea>
            </div>

            <div class="flex flex-col gap-2">
                <label for="negative-prompt" class="font-medium">Enter negative prompt:</label>
                <textarea
                    id="negative-prompt"
                    bind:value={negativePrompt}
                    placeholder="Describe what you want to avoid in the generation..."
                    class="w-full p-2 rounded border border-gray-300 min-h-[100px] resize-y"
                ></textarea>
            </div>

            <div class="flex flex-col gap-2">
                <label for="seed" class="font-medium">Seed (-1 for random):</label>
                <input
                    id="seed"
                    type="number"
                    bind:value={seed}
                    class="w-full p-2 rounded border border-gray-300"
                    min="-1"
                />
            </div>
        </div>

        <button 
            on:click={runWorkflow} 
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={status !== 'Idle' && status !== 'Completed' && status !== 'Error' || !userPrompt.trim()}
        >
            Generate Image
        </button>
    </div>
    
    <div class="mb-4">
        <p class="font-semibold">Status: <span class={status === 'Error' ? 'text-red-600' : 'text-green-600'}>{status}</span></p>
        {#if jobId}
            <p class="text-sm text-gray-600">Job ID: {jobId}</p>
        {/if}
    </div>
    
    {#if status !== 'Idle' && status !== 'Completed' && status !== 'Error'}
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div class="bg-blue-600 h-2.5 rounded-full" style="width: {progress}%"></div>
        </div>
    {/if}
    
    {#if error}
        <div class="p-4 bg-red-100 rounded mb-4">
            <p class="text-red-600 font-semibold">Error:</p>
            <p class="text-red-800">{error}</p>
        </div>
    {/if}

    {#if logs.length > 0}
        <div class="mt-4">
            <h4 class="font-semibold mb-2">Generation Logs:</h4>
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
                            <span class="text-white">{formatProgressBar(log.message)}</span>
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
                    <div class="animate-pulse">▋</div>
                {/if}
            </div>
        </div>
    {/if}

    {#if runpodStatus}
        <div class="mt-4 p-4 bg-white rounded shadow-sm">
            <h4 class="font-semibold mb-2">RunPod Status:</h4>
            <div class="text-sm">
                <p>Status: <span class="font-medium">{runpodStatus.status}</span></p>
                {#if runpodStatus.delayTime !== undefined}
                    <p>Delay Time: {runpodStatus.delayTime}ms</p>
                {/if}
                {#if runpodStatus.executionTime !== undefined}
                    <p>Execution Time: {runpodStatus.executionTime}ms</p>
                {/if}
                {#if runpodStatus.error}
                    <p class="text-red-600">Error: {runpodStatus.error}</p>
                {/if}
                
                <!-- Add complete response section -->
                <div class="mt-4">
                    <h5 class="font-semibold mb-2">Complete Response:</h5>
                    <pre class="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                        {JSON.stringify(runpodStatus, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    {/if}
    
    {#if imageUrl}
        <div class="mt-4">
            <h4 class="font-semibold mb-2">Generated Image:</h4>
            <div class="bg-white p-2 rounded shadow-sm">
                <img 
                    src={imageUrl}
                    alt="Generated image" 
                    class="max-w-full h-auto rounded"
                />
                <a href="{imageUrl}" target="_blank" class="text-blue-500 hover:underline">
                    {imageUrl}
                </a>
            </div>
        </div>
    {/if}
</div>