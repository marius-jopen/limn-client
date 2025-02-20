<script>
    import { onMount } from 'svelte';
    import Button from '../atomic-components/Button.svelte';
    import Error from '../atomic-components/Error.svelte';
    import Status from '../atomic-components/Status.svelte';
    import StatusGrid from '../ui-components/StatusGrid.svelte';

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

    $: statusFields = data ? [
        { label: 'Completed Jobs', value: data.data.jobs.completed },
        { label: 'Failed Jobs', value: data.data.jobs.failed },
        { label: 'Jobs In Progress', value: data.data.jobs.inProgress },
        { label: 'Jobs In Queue', value: data.data.jobs.inQueue },
        { label: 'Retried Jobs', value: data.data.jobs.retried },
        { label: 'Idle Workers', value: data.data.workers.idle },
        { label: 'Ready Workers', value: data.data.workers.ready },
        { label: 'Running Workers', value: data.data.workers.running, isLast: true }
    ] : [];
</script>

<h2>
    {service} RunPod Health Status
</h2>

{#if error}
    <Error message={error} />
{:else}
    <Status {status} />
    
    {#if data}
        <StatusGrid fields={statusFields} />
    {/if}
{/if}

<Button 
    onClick={checkHealth}
    label="Refresh Status"
    variant="primary"
    size="md"
/>