<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { prepareWorkflow } from '$lib/runpod/helper/PrepareWorkflow';
    import { runState, loadWorkflowState } from '$lib/runpod/helper/StoreRun.js';
    import Button from '$lib/atoms/Button.svelte';
    import InputRepeater from '$lib/runpod/studio/basic/components/InputRepeater.svelte';
    import { onMount } from 'svelte';

    // Get the server URL from environment variables - this is required to run the application
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    // Validate that the environment variable is set - throw an error if it's not available
    if (!serverUrl) {
        throw new Error('VITE_SERVER_URL environment variable is not set. This is required to run the application.');
    }

    interface UIConfigField {
        id: string;
        type: string;
        default: string | number;
        label?: string;
        placeholder: string;
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
    
    let values: Record<string, string | number> = Object.fromEntries(ui_config.map(field => [field.id, field.default]));
    
    $: user_id = $user?.id;

    // Load saved state for this workflow when the component mounts
    onMount(() => {
        if (workflow_name) {
            const savedState = loadWorkflowState(workflow_name);
            // If there are saved values for this workflow, use them
            if (savedState && savedState.values) {
                values = { ...values, ...savedState.values };
            }
        }
    });

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
            service,
            workflow_name,
            statusFields,
            logs,
            status,
            runpodStatus,
            images,
            values // Also store the current input values
        });
    }

    async function runWorkflow() {
        ({ status, error, result, jobId, imageUrl, images, runpodStatus, logs } = INITIAL_STATE);
        status = 'Starting...';

        if (!workflow || Object.keys(workflow).length === 0) {
            error = 'No workflow configuration provided';
            status = 'Error';
            return;
        }

        // Reset any empty string values to their defaults
        ui_config.forEach(field => {
            if (field.type === 'string' && typeof values[field.id] === 'string' && !(values[field.id] as string).trim()) {
                values[field.id] = field.default;
            }
        });
        
        try {
            const workflowWithPrompt = prepareWorkflow(workflow, ui_config, values);
                        
            const response = await fetch(`${serverUrl}/${service}-runpod-serverless-run`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': user_id,
                    'service': service,
                    'workflow': workflow_name 
                },
                body: JSON.stringify({ 
                    input: { 
                        workflow: workflowWithPrompt,
                        user: user_id
                    } 
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            jobId = data.data.id;
            
            await pollJob(jobId);
        } catch (err) {
            error = err.message;
            status = 'Error';
            result = null;
            console.error('Workflow execution error:', err);
        }
    }

    async function pollJob(id) {
        for (let attempt = 0; attempt < POLL_CONFIG.maxAttempts; attempt++) {
            try {
                const response = await fetch(
                    `${serverUrl}/${service}-runpod-serverless-status/${id}?userId=${user_id}&service=${service}&workflow=${workflow_name}`,
                    {
                        headers: {
                            'user-id': user_id,
                            'service': service,
                            'workflow': workflow_name
                        }
                    }
                );
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
                    imageUrl = data.output?.[1]?.images?.[0]?.url;
                    images = data.output?.[1]?.images || [];
                    status = 'Completed';
                    return;
                }
                
                if (data.status === 'FAILED') {
                    const errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                    throw new Error(`Job failed: ${errorMessage}`);
                }

                status = data.status === 'IN_QUEUE' ? 'Queued' : 'Processing';
                await new Promise(resolve => setTimeout(resolve, POLL_CONFIG.interval));
            } catch (err) {
                error = err.message;
                status = 'Error';
                result = null;
                runpodStatus = { status: 'FAILED', error: err.message };
                return;
            }
        }

        error = 'Timeout waiting for job completion';
        status = 'Error';
        result = null;
        runpodStatus = { status: 'FAILED', error: 'Timeout waiting for job completion' };
    }

    // Function to cast the UI config to the expected type for InputRepeater
    function castUIConfig(config: UIConfigField[]) {
        return config as any;
    }
</script>

<div>
    <InputRepeater UI={castUIConfig(ui_config)} bind:values />
    <Button onClick={runWorkflow} label="Generate" disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'} />
</div>