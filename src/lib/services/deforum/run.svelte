<script>
    import DEFAULT_WORKFLOW from '../../workflows/deforum/deforum-test.json';
    import Button from '../../atomic-components/Button.svelte';
    import InputPrompt from '../../ui-components/InputPrompt.svelte';
    import InputNumber from '../../ui-components/InputNumber.svelte';
    import InputText from '../../ui-components/InputText.svelte';
    import ImageList from '../../ui-components/ImageList.svelte';
    import AdvancedLogViewer from '../../ui-components/AdvancedLogViewer.svelte';
    import JsonViewer from '../../ui-components/JsonViewer.svelte';

    // Group related state variables
    const INITIAL_STATE = {
        status: 'Idle',
        error: null,
        jobId: null,
        logs: [],
        images: [],
        runpodStatus: null,
        manualJobId: ''
    };

    // Initialize state
    let { status, error, jobId, logs, images, runpodStatus, manualJobId } = INITIAL_STATE;
    let positivePrompt1 = "beautiful lady, (freckles), big smile, brown hazel eyes";
    let positivePrompt2 = "beautiful alien";
    let negativePrompt1 = "bad eyes, cgi, airbrushed, plastic, deformed";
    let negativePrompt2 = "ugly, blurry, low quality, distorted features";
    let seed = 1;
    let username = "a87ae7bc-6e08-45b7-a464-4f91cb01b1a7";
    let service = "deforum";
    let workflow_name = "deforum-test";

    function prepareWorkflow({
        positivePrompt1,
        positivePrompt2,
        negativePrompt1,
        negativePrompt2,
        seed
    }) {
        // Generate seed and batch name
        const actualSeed = seed === -1 ? Math.floor(Math.random() * 1000000000) : seed;
        const batchName = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create workflow with variables
        const workflowCopy = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW));
        const stringified = JSON.stringify(workflowCopy)
            .replace('${INPUT_PROMPT_1}', positivePrompt1)
            .replace('${INPUT_PROMPT_2}', positivePrompt2)
            .replace('${INPUT_NEGATIVEPROMPT_1}', negativePrompt1)
            .replace('${INPUT_NEGATIVEPROMPT_2}', negativePrompt2)
            .replace('${SEED}', actualSeed.toString())
            .replace('${BATCH_NAME}', batchName);
        
        return JSON.parse(stringified);
    }

    async function runWorkflow() {
        // Reset state at the start of new workflow
        ({ status, error, jobId, logs, images, runpodStatus } = INITIAL_STATE);
        status = 'Starting...';

        try {
            const finalWorkflow = prepareWorkflow({
                positivePrompt1,
                positivePrompt2,
                negativePrompt1,
                negativePrompt2,
                seed
            });

            const batchName = new Date().toISOString().replace(/[:.]/g, '-');
            
            const response = await fetch('http://localhost:4000/api/deforum-runpod-serverless-run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': username,
                    'service': service,
                    'workflow': workflow_name,
                    'batch-name': batchName
                },
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

    async function streamJob(id) {
        try {
            const eventSource = new EventSource(
                `http://localhost:4000/api/deforum-runpod-serverless-stream/${id}?userId=${username}&service=${service}&workflow=${workflow_name}`
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
                                if (streamItem.output?.log) {
                                    const logEntry = {
                                        type: 'worker',
                                        timestamp: new Date().toISOString(),
                                        level: 'INFO',
                                        message: streamItem.output.log
                                    };
                                    logs = [...logs, logEntry];
                                }
                            });
                        }

                        // Handle direct output logs
                        if (data.output?.log) {
                            const logEntry = {
                                type: 'worker',
                                timestamp: new Date().toISOString(),
                                level: 'INFO',
                                message: data.output.log
                            };
                            logs = [...logs, logEntry];
                        }

                        runpodStatus = data;

                        // Handle images
                        if (data.stream && Array.isArray(data.stream)) {
                            data.stream.forEach(streamItem => {
                                if (streamItem.output?.images && Array.isArray(streamItem.output.images)) {
                                    streamItem.output.images.forEach(image => {
                                        if (image.url && !images.includes(image.url)) {
                                            console.log('New image from stream:', image.url);
                                            images = [...images, image.url];
                                            // Add a log entry for the image
                                            const imageLogEntry = {
                                                type: 'worker',
                                                timestamp: new Date().toISOString(),
                                                level: 'INFO',
                                                message: `Generated new image: ${image.url}`
                                            };
                                            logs = [...logs, imageLogEntry];
                                        }
                                    });
                                }
                            });
                        }

                        // Check for completion
                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                            const statusLogEntry = {
                                type: data.status === 'COMPLETED' ? 'worker' : 'error',
                                timestamp: new Date().toISOString(),
                                level: data.status === 'COMPLETED' ? 'INFO' : 'ERROR',
                                message: `Job ${data.status.toLowerCase()}`
                            };
                            logs = [...logs, statusLogEntry];
                            console.log(`Job ${id} finished with status: ${data.status}`);
                            eventSource.close();
                            resolve();
                        }
                    } catch (err) {
                        console.error('Error parsing stream data:', err);
                        const errorLogEntry = {
                            type: 'error',
                            timestamp: new Date().toISOString(),
                            level: 'ERROR',
                            message: `Error parsing stream data: ${err.message}`
                        };
                        logs = [...logs, errorLogEntry];
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
</script>

<div class="px-4 pb-8">
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
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

    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Cancel Current Job
        </h2>

        <InputText
            id="manual-job-id"
            bind:value={manualJobId}
            placeholder="Enter job ID to cancel"
        />
        
        <Button
            onClick={() => { jobId = manualJobId; streamJob(manualJobId); }}
            disabled={!manualJobId || status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'}
            label="Cancel"
        />
    </div>

    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4 mb-4">
        <h2>
            Status & Logs
        </h2>

        <div class="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden bg-white divide-x divide-gray-200">
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
            Current Output
        </h2>

        <ImageList id="output-images" label="Output Images" {images} />
    </div>
</div>