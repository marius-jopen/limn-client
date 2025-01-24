<script>
    import DEFAULT_WORKFLOW from '../../workflows/deforum-basic.json';

    // State variables
    let status = 'Idle';
    let error = null;
    let jobId = null;
    let logs = [];
    let images = [];
    
    // Input variables
    let userPrompt = "beautiful lady, (freckles), big smile, brown hazel eyes";
    let negativePrompt = "bad eyes, cgi, airbrushed, plastic, deformed";
    let seed = 1;
    let username = "marius";

    // Reference to the logs container
    let logsContainer;

    // Function to scroll to bottom
    function scrollToBottom() {
        if (logsContainer) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }

    async function streamJob(id) {
        try {
            const eventSource = new EventSource(
                `http://localhost:4000/api/deforum-runpod-serverless-stream/${id}`
            );

            return new Promise((resolve, reject) => {
                eventSource.onmessage = (event) => {
                    try {
                        const jsonStr = event.data.replace(/^data: /, '');
                        const data = JSON.parse(jsonStr);
                        console.log('Stream data:', data);

                        // Update status if available
                        if (data.status) {
                            if (data.status === 'IN_PROGRESS') {
                                status = 'Running...';
                            } else {
                                status = data.status;
                            }
                        }

                        // Handle stream data
                        if (data.stream && Array.isArray(data.stream)) {
                            data.stream.forEach(streamItem => {
                                // Handle logs
                                if (streamItem.output?.log) {
                                    logs = [...logs, streamItem.output.log];
                                    // Scroll to bottom after adding new log
                                    setTimeout(scrollToBottom, 0);
                                }
                                
                                // Handle images
                                if (streamItem.output?.images && Array.isArray(streamItem.output.images)) {
                                    streamItem.output.images.forEach(image => {
                                        if (image.url && !images.includes(image.url)) {
                                            console.log('New image from stream:', image.url);
                                            images = [...images, image.url];
                                        }
                                    });
                                }
                            });
                        }

                        // Check for completion
                        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
                            console.log(`Job ${id} finished with status: ${data.status}`);
                            eventSource.close();
                            resolve();
                        }
                    } catch (err) {
                        console.error('Error parsing stream data:', err);
                        console.warn('Continuing stream despite parse error');
                    }
                };

                eventSource.onerror = (err) => {
                    console.error('EventSource error:', err);
                    // Don't close the connection on error, let it auto-reconnect
                    console.warn('EventSource error occurred, waiting for reconnection');
                };

                // Set a timeout of 10 minutes
                setTimeout(() => {
                    console.log('Stream timeout reached');
                    eventSource.close();
                    reject(new Error('Stream timeout: Job took too long to complete'));
                }, 10 * 60 * 1000);
            });

        } catch (err) {
            console.error('Stream error:', err);
            error = err.message;
            status = 'Error';
        }
    }

    async function runWorkflow() {
        try {
            status = 'Starting...';
            error = null;
            logs = [];
            images = [];

            const actualSeed = seed === -1 ? Math.floor(Math.random() * 1000000000) : seed;
            
            const workflowWithPrompt = {
                ...DEFAULT_WORKFLOW,
                prompt: userPrompt,
                negative_prompt: negativePrompt,
                seed: actualSeed
            };

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            jobId = data.data.id;
            
            await streamJob(jobId);
        } catch (err) {
            console.error('Workflow error:', err);
            error = err.message;
            status = 'Error';
        }
    }
</script>

<div class="p-4 rounded-lg bg-gray-100">
    <div class="flex flex-col gap-4 mb-4">
        <h1 class="text-xl font-bold">Deforum RunPod Workflow</h1>
        
        <!-- Prompt inputs -->
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="prompt" class="font-medium">Prompt:</label>
                <textarea
                    id="prompt"
                    bind:value={userPrompt}
                    class="w-full p-2 rounded border border-gray-300"
                ></textarea>
            </div>

            <div class="flex flex-col gap-2">
                <label for="negative-prompt" class="font-medium">Negative prompt:</label>
                <textarea
                    id="negative-prompt"
                    bind:value={negativePrompt}
                    class="w-full p-2 rounded border border-gray-300"
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
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'}
        >
            Generate
        </button>
    </div>
    
    <!-- Status and error display -->
    <div class="mb-4">
        <p class="font-semibold">Status: {status}</p>
        {#if jobId}
            <p class="text-sm text-gray-600">Job ID: {jobId}</p>
        {/if}
        {#if error}
            <p class="text-red-600">{error}</p>
        {/if}
    </div>

    <!-- Logs display -->
    {#if logs.length > 0}
        <div class="mt-4">
            <h4 class="font-semibold mb-2">Logs:</h4>
            <div 
                bind:this={logsContainer}
                class="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-y-auto max-h-[300px]"
            >
                {#each logs as log}
                    <div class="whitespace-pre-wrap">{log}</div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Add image display -->
    {#if images.length > 0}
        <div class="mt-4">
            <!-- New Image List View -->
            <div class="mt-8">
                <h4 class="font-semibold mb-2">Image List:</h4>
                <div class="space-y-4">
                    {#each images as imageUrl}
                        <div class="flex items-center gap-4 p-2 bg-white rounded-lg shadow">
                            <img 
                                src={imageUrl} 
                                alt="Thumbnail" 
                                class="w-48 h-48 object-cover rounded"
                            />
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-600">
                                    {imageUrl.split('/').pop().split('?')[0]}
                                </span>
                                <span class="text-xs text-gray-400 break-all">
                                    {imageUrl}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>