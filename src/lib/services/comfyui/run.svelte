<script>
    import DEFAULT_WORKFLOW from '../../workflows/comfyui.json';

    let status = 'Idle';
    let error = null;
    let result = null;
    let progress = 0;
    let jobId = null;
    let generatedImage = null;
    let runpodStatus = null;
    let imageUrl = null;  // New variable for the image URL
    let logs = [];  // Array to store log messages
    let userPrompt = ""; // New variable for the prompt input

    async function pollJob(id) {
        const maxAttempts = 360;
        const interval = 500;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:4000/api/comfyui-runpod-serverless-status/${id}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                runpodStatus = data;
                
                // Update logs if there are new ones
                if (data.logs && data.logs.length > 0) {
                    const newLogs = data.logs.filter(log => !logs.includes(log));
                    if (newLogs.length > 0) {
                        logs = [...logs, ...newLogs];
                        setTimeout(() => {
                            const logContainer = document.querySelector('.log-container');
                            if (logContainer) {
                                logContainer.scrollTop = logContainer.scrollHeight;
                            }
                        }, 0);
                    }
                }

                // Better progress calculation
                if (data.status === 'IN_QUEUE') {
                    progress = 5;
                } else if (data.status === 'IN_PROGRESS') {
                    // If we have execution time, use it for a more accurate progress
                    if (data.executionTime) {
                        // Assuming average job takes about 30 seconds
                        const estimatedProgress = Math.min(90, (data.executionTime / 30000) * 100);
                        progress = Math.max(progress, 10 + estimatedProgress);
                    } else {
                        // Fallback to a smoother progression
                        progress = Math.min(90, 10 + (attempt * 2));
                    }
                } else if (data.status === 'COMPLETED') {
                    progress = 100;
                    result = data;
                    if (data.output && 
                        data.output[0] && 
                        data.output[0].images && 
                        data.output[0].images[0] && 
                        data.output[0].images[0].url) {
                        imageUrl = data.output[0].images[0].url;
                    }
                    status = 'Completed';
                    return;
                }
                
                if (data.status === 'FAILED') {
                    throw new Error(`Job failed: ${JSON.stringify(data.error)}`);
                }

                status = data.status === 'IN_QUEUE' ? 'Queued' : 'Processing';
                await new Promise(resolve => setTimeout(resolve, interval));
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
            error = "Please enter a prompt";
            return;
        }

        status = 'Starting...';
        error = null;
        result = null;
        progress = 0;
        imageUrl = null;
        runpodStatus = null;
        logs = [];
        
        try {
            // Create a copy of the workflow and replace the placeholder
            const workflowString = JSON.stringify(DEFAULT_WORKFLOW);
            const workflowWithPrompt = JSON.parse(
                workflowString.replace('{{INPUT_PROMPT}}', userPrompt)
            );

            const response = await fetch('http://localhost:4000/api/comfyui-runpod-serverless-run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        workflow: workflowWithPrompt
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            jobId = data.data.id;
            
            await pollJob(jobId);
        } catch (err) {
            error = err.message;
            status = 'Error';
            result = null;
        }
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
</script>

<div class="p-4 rounded-lg bg-gray-100">
    <div class="flex flex-col gap-4 mb-4">
        <h1 class="text-xl font-bold">ComfyUI RunPod Workflow</h1>
        
        <!-- New prompt input section -->
        <div class="flex flex-col gap-2">
            <label for="prompt" class="font-medium">Enter your prompt:</label>
            <textarea
                id="prompt"
                bind:value={userPrompt}
                placeholder="Describe what you want to generate..."
                class="w-full p-2 rounded border border-gray-300 min-h-[100px] resize-y"
            ></textarea>
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