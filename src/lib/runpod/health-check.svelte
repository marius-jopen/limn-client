<script>
    import { onMount } from 'svelte';
    import Button from '../atomic-components/Button.svelte';
    import Error from '../atomic-components/Error.svelte';
    import Status from '../atomic-components/Status.svelte';

    export let service;

    let status = 'Loading...';
    let error = null;
    let data = null;

    async function checkHealth() {
        try {
            const response = await fetch('http://localhost:4000/api/' + service + '-runpod-serverless-health');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            console.log(data);
            status = data.status || 'OK';
            error = null;
        } catch (err) {
            error = err.message;
            status = 'Error';
            data = null;
        }
    }

    onMount(() => {
        checkHealth();
    });
</script>

<div class="px-4 pb-4">
    <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
        <h2>
            {service} RunPod Health Status
        </h2>

        {#if error}
            <Error message={error} />
        {:else}
            <Status {status} />
            
            {#if data}
                <div class="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden bg-white divide-x divide-gray-200">
                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Completed Jobs:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.jobs.completed}</div>
                    </div>
                    
                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Failed Jobs:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.jobs.failed}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Jobs In Progress:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.jobs.inProgress}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Jobs In Queue:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.jobs.inQueue}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Retried Jobs:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.jobs.retried}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Idle Workers:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.workers.idle}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3 border-b border-gray-200">Ready Workers:</div>
                        <div class="p-3 border-b border-gray-200">{data.data.workers.ready}</div>
                    </div>

                    <div class="contents">
                        <div class="font-medium p-3">Running Workers:</div>
                        <div class="p-3">{data.data.workers.running}</div>
                    </div>
                </div>
            {/if}
        {/if}

        <Button 
            onClick={checkHealth}
            label="Refresh Status"
            variant="primary"
            size="md"
        />
    </div>
</div>