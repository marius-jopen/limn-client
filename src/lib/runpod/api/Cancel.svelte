<script>
    import Button from '$lib/atoms/Button.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';

    const serverUrl = import.meta.env.VITE_SERVER_URL;

    let status = 'Ready to cancel';
    let error = null;
    let data = null;
    let currentJobId;

    // Subscribe to runState
    $: {
        if ($runState) {
            currentJobId = $runState.statusFields?.find(field => field.label === "Job ID")?.value;
            status = 'Ready to cancel';
            error = null;
        }
    }

    async function cancelJob() {
        try {
            status = 'Cancelling...';
            const response = await fetch(`${serverUrl}/cancel-runpod-serverless/${currentJobId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            status = 'Cancelled';
            error = null;
        } catch (err) {
            console.error('Cancel error:', err);
            error = err.message;
            status = 'Error cancelling job';
            data = null;
        }
    }
</script>

<Button 
    onClick={cancelJob}
    label="Pause" 
    variant="tertiary" 
    size="sm" 
/>

<!-- <div class="mt-2 text-sm">
    <p>Status: {status}</p>
    {#if error}<p class="text-red-500">{error}</p>{/if}
</div> -->
