<script>
    import { onMount } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import StatusTable from '$lib/runpod/components/StatusTable.svelte';

    export let service;
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    let status = 'Loading...';
    let error = null;
    let data = null;

    async function checkHealth() {
        try {
            const response = await fetch(serverUrl + '/' + service + '-runpod-serverless-health');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
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
        { label: 'Status', value: status },
        { label: error ? 'Error' : 'Message', value: error || 'System operational' },
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

<div>
    <h2>Health {service}</h2>
    <StatusTable fields={statusFields} />
    <Button onClick={checkHealth} label="Refresh Status" variant="primary" size="md" />
</div>