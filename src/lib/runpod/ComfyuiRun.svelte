<script lang="ts">
    import { user } from '$lib/supabase/helper/store-supabase';
    import { prepareWorkflow } from '$lib/runpod/helper/PrepareWorkflow';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import Button from '$lib/atoms/Button.svelte';
    import RunUI from '$lib/runpod/ui/RunUi.svelte';

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
    export let ui_config: UIConfigField[] = [];
    
    let values: Record<string, string | number> = Object.fromEntries(ui_config.map(field => [field.id, field.default]));
    
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
        ({ status, error, result, jobId, imageUrl, images, runpodStatus, logs } = INITIAL_STATE);
        status = 'Starting...';

        // Reset any empty string values to their defaults
        ui_config.forEach(field => {
            if (field.type === 'string' && !values[field.id]?.trim()) {
                values[field.id] = field.default;
            }
        });
        
        try {
            const workflowWithPrompt = prepareWorkflow(workflow, ui_config, values);

            const response = await fetch('http://localhost:4000/api/' + service + '-runpod-serverless-run', {
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

<div>
    <RunUI UI={ui_config} bind:values />
    <Button onClick={runWorkflow} label="Generate" disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'} />
</div>