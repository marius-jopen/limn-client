<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { prepareWorkflow } from '$lib/runpod/helper/PrepareWorkflow.js';
    import Button from '$lib/atoms/Button.svelte';
    import InputRepeater from '$lib/runpod/ui/InputRepeater.svelte';

    interface UIConfigField {
        id: string;
        type: string;
        default: string | number;
        label?: string;
    }

    interface RunpodStatus {
        status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
        delayTime?: number;
        endpointId?: string;
        workerId?: string;
        logs?: string[];
        error?: any;
        output?: Array<{
            images: Array<{
                url: string;
                [key: string]: any;
            }>;
        }>;
    }

    interface StatusField {
        label: string;
        value: string;
        isLast?: boolean;
    }

    interface InitialState {
        status: string;
        error: string | null;
        result: RunpodStatus | null;
        jobId: string | null;
        imageUrl: string | null;
        images: Array<{ url: string; [key: string]: any }>;
        runpodStatus: RunpodStatus | null;
        logs: string[];
    }

    const INITIAL_STATE: InitialState = {
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
    export let service: string;
    export let workflow_name: string;
    export let workflow = {};
    export let ui_config: UIConfigField[] = [];
    
    let values: Record<string, string | number> = {
        ...Object.fromEntries(ui_config.map(field => [field.id, field.default]))
    };
    
    $: user_id = $user?.id;

    $: statusFields = [
        { label: 'User ID', value: user_id },
        { label: 'Status', value: status || 'Idle' },
        { label: 'RunPod Status', value: runpodStatus?.status || 'Not started' },
        { label: 'Error', value: error || 'No Error' },
        { label: 'Job ID', value: jobId || 'No JobID received' },
        { label: 'Delay Time', value: runpodStatus?.delayTime !== undefined ? `${runpodStatus.delayTime}ms` : 'No delay time available' },
        { label: 'Endpoint ID', value: runpodStatus?.endpointId || 'No endpoint ID available' },
        { label: 'Worker ID', value: runpodStatus?.workerId || 'No worker ID available', isLast: true }
    ] as StatusField[];

    // Update the store whenever the state changes
    $: {
        runState.set({
            statusFields,
            logs,
            status,
            runpodStatus,
            images
        });
    }

    async function runWorkflow() {
        // Generate actual seed if needed
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}${date.getSeconds().toString().padStart(2,'0')}`;

        // Clear the images array and update the store
        images = [];
        runState.update(state => ({ ...state, images: [] }));
        
        ({ status, error, result, jobId, imageUrl, images, runpodStatus, logs } = INITIAL_STATE);
        status = 'Starting...';

        if (!workflow || Object.keys(workflow).length === 0) {
            error = 'No workflow configuration provided';
            status = 'Error';
            return;
        }

        try {
            // Create a deep copy of the workflow and replace BATCH_NAME
            let workflowCopy = JSON.parse(
                JSON.stringify(workflow).replace('${BATCH_NAME}', dateStr)
            );

            // Use the imported prepareWorkflow function
            const workflowWithPrompt = prepareWorkflow(workflowCopy, ui_config, values);
            // console.log('Workflow with prompt:', workflowWithPrompt);

            const response = await fetch('http://localhost:4000/api/' + service + '-runpod-serverless-run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': user_id,
                    'service': service,
                    'workflow': workflow_name,
                    'batch-name': dateStr
                },
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
            
            await streamJob(jobId);
        } catch (err) {
            error = err.message;
            status = 'Error';
            result = null;
        }
    }

    async function streamJob(id) {
        try {
            const eventSource = new EventSource(
                `http://localhost:4000/api/${service}-runpod-serverless-stream/${id}?userId=${user_id}&service=${service}&workflow=${workflow_name}`
            );

            return new Promise((resolve, reject) => {
                eventSource.onmessage = (event) => {
                    try {
                        const jsonStr = event.data.replace(/^data: /, '');
                        const data = JSON.parse(jsonStr);
                        // console.log('Received data:', data); // Debug log
                        
                        // Handle error first
                        if (data.error) {
                            const errorLogEntry = {
                                type: 'error',
                                timestamp: new Date().toISOString(),
                                level: 'ERROR',
                                message: `Job failed: ${JSON.stringify(data.error)}`
                            };
                            // console.error('Error log entry:', errorLogEntry);
                            logs = [...logs, errorLogEntry];
                            status = 'Error';
                            error = JSON.stringify(data.error);
                            eventSource.close();
                            reject(new Error(data.error));
                            return;
                        }

                        // Rest of the existing message handling...
                        if (data.status) {
                            status = data.status === 'IN_PROGRESS' ? 'Running...' : data.status;
                        }

                        // Add a status log entry
                        const statusLogEntry = {
                            type: 'worker',
                            timestamp: new Date().toISOString(),
                            level: 'INFO',
                            message: `Status: ${status}`
                        };
                        logs = [...logs, statusLogEntry];

                        runpodStatus = data;

                        // Handle stream data and logs
                        if (data.stream && Array.isArray(data.stream)) {
                            data.stream.forEach(streamItem => {
                                if (streamItem.output?.log) {
                                    const logEntry = {
                                        type: 'worker',
                                        timestamp: new Date().toISOString(),
                                        level: 'INFO',
                                        message: streamItem.output.log
                                    };
                                    // console.log('Adding log entry:', logEntry); // Debug log
                                    logs = [...logs, logEntry];
                                }
                            });
                        }

                        // Handle images
                        if (data.stream && Array.isArray(data.stream)) {
                            data.stream.forEach(streamItem => {
                                if (streamItem.output?.images && Array.isArray(streamItem.output.images)) {
                                    const newImages = streamItem.output.images.filter(img => !images.some(existing => existing.url === img.url));
                                    if (newImages.length > 0) {
                                        images = [...images, ...newImages];
                                        // Add log entries for new images
                                        newImages.forEach(image => {
                                            const imageLogEntry = {
                                                type: 'worker',
                                                timestamp: new Date().toISOString(),
                                                level: 'INFO',
                                                message: `Generated new image: ${image.url}`
                                            };
                                            // console.log('Adding image log entry:', imageLogEntry); // Debug log
                                            logs = [...logs, imageLogEntry];
                                        });
                                    }
                                }
                            });
                        }

                        // Check for completion
                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                            const completionLogEntry = {
                                type: data.status === 'COMPLETED' ? 'worker' : 'error',
                                timestamp: new Date().toISOString(),
                                level: data.status === 'COMPLETED' ? 'INFO' : 'ERROR',
                                message: `Job ${data.status.toLowerCase()}`
                            };
                            // console.log('Adding completion log entry:', completionLogEntry); // Debug log
                            logs = [...logs, completionLogEntry];
                            eventSource.close();
                            resolve();
                        }
                    } catch (err) {
                        const errorLogEntry = {
                            type: 'error',
                            timestamp: new Date().toISOString(),
                            level: 'ERROR',
                            message: `Stream error: ${err.message}`
                        };
                        console.error('Error log entry:', errorLogEntry);
                        logs = [...logs, errorLogEntry];
                        status = 'Error';
                        error = err.message;
                        eventSource.close();
                        reject(err);
                    }
                };

                eventSource.onerror = (err) => {
                    const errorLogEntry = {
                        type: 'error',
                        timestamp: new Date().toISOString(),
                        level: 'ERROR',
                        message: `EventSource error: ${err.message || 'Unknown error'}`
                    };
                    console.error('EventSource error:', err);
                    logs = [...logs, errorLogEntry];
                    // Don't close the connection on error, let it auto-reconnect
                    console.warn('EventSource error occurred, waiting for reconnection');
                };

                // Set a timeout of 10 minutes
                setTimeout(() => {
                    eventSource.close();
                    reject(new Error('Stream timeout: Job took too long to complete'));
                }, 10 * 60 * 1000);
            });

        } catch (err) {
            error = err.message;
            status = 'Error';
            throw err;
        }
    }
</script>

<div>
    <InputRepeater UI={ui_config} bind:values />
    <Button onClick={runWorkflow} label="Generate" disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'} />
</div>