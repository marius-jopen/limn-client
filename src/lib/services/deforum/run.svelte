<script>
    import DEFAULT_WORKFLOW from '../../workflows/deforum/deforum-test.json';
    import Button from '../../atomic-components/Button.svelte';
    import InputPrompt from '../../ui-components/InputPrompt.svelte';
    import InputNumber from '../../ui-components/InputNumber.svelte';
    import InputText from '../../ui-components/InputText.svelte';
    import LogViewer from '../../ui-components/LogViewer.svelte';

    // State variables
    let status = 'Idle';
    let error = null;
    let jobId = null;
    let logs = [];
    let images = [];
    
    // Input variables
    let positivePrompt1 = "beautiful lady, (freckles), big smile, brown hazel eyes";
    let positivePrompt2 = "beautiful alien";
    let negativePrompt1 = "bad eyes, cgi, airbrushed, plastic, deformed";
    let negativePrompt2 = "ugly, blurry, low quality, distorted features";
    let seed = 1;
    let username = "marius";
    let manualJobId = '';

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

                        // Check for completion (remove CANCELLED status)
                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
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
            
            // Create a deep copy of the default workflow
            const workflowWithPrompt = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW));

            // Replace the template variables
            const stringified = JSON.stringify(workflowWithPrompt)
                .replace('${INPUT_PROMPT_1}', positivePrompt1)
                .replace('${INPUT_PROMPT_2}', positivePrompt2)
                .replace('${INPUT_NEGATIVEPROMPT_1}', negativePrompt1)
                .replace('${INPUT_NEGATIVEPROMPT_2}', negativePrompt2)
                .replace('${SEED}', actualSeed.toString());

            const finalWorkflow = JSON.parse(stringified);

            const response = await fetch('http://localhost:4000/api/deforum-runpod-serverless-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: {
                        workflow: finalWorkflow,
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
        <h1>
            Deforum RunPod Workflow
        </h1>
        
        <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
            <h2>
                Generate Video
            </h2>

            <InputPrompt
                id="prompt1"
                label="Prompt 1"
                bind:value={positivePrompt1}
            />

            <InputPrompt
                id="negative-prompt1"
                label="Negative prompt 1"
                bind:value={negativePrompt1}
            />

            <InputPrompt
                id="prompt2"
                label="Prompt 2"
                bind:value={positivePrompt2}
            />

            <InputPrompt
                id="negative-prompt2"
                label="Negative prompt 2"
                bind:value={negativePrompt2}
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

        <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
            <h2>
                Cancel Current Job
            </h2>

            <InputText
                id="manual-job-id"
                bind:value={manualJobId}
                placeholder="Enter job ID to monitor"
            />
            
            <Button
                onClick={() => { jobId = manualJobId; streamJob(manualJobId); }}
                disabled={!manualJobId || status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'}
                label="Cancel"
            />
        </div>
    </div>
    
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Status & Logs
        </h2>

        <div class="font-semibold">
            Status: {status}
        </div>

        {#if jobId}
            <div class="text-sm text-gray-600">
                Job ID: {jobId}
            </div>
        {/if}

        {#if error}
            <div class="text-red-600">
                {error}
            </div>
        {/if}

        <LogViewer variant="dark" logs={logs} />
    </div>

    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
        <h2>
            Output
        </h2>

    </div>

    <!-- Add image display -->
    {#if images.length > 0}
        <div class="mt-4">
            <!-- New Image List View -->
            <div class="mt-8">
                <h4 class="font-semibold mb-2">
                    Image List:
                </h4>

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

                                <a target="_blank" href={imageUrl} class="text-xs text-gray-400 break-all">
                                    {imageUrl}
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>