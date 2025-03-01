<script>
    import Button from '$lib/atoms/Button.svelte';

    export let jobId;
    let status = 'Ready to cancel';
    let error = null;
    let data = null;

    // Log when jobId changes
    $: {
        // console.log('Cancel component jobId updated:', jobId);
        status = 'Ready to cancel';
        error = null;
    }

    async function cancelJob() {
        // console.log('Cancelling job with ID:', jobId);
        try {
            status = 'Cancelling...';
            const response = await fetch(`http://localhost:4000/api/cancel-runpod-serverless/${jobId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            // console.log('Cancel response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            // console.log('Cancel response data:', data);
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

<div class="mt-4">
    <Button 
        onClick={cancelJob}
        label="Cancel Job" 
        variant="primary" 
        size="md" 
    />
    <div class="mt-2 text-sm">
        <!-- <p>Current Job ID: {jobId}</p> -->
        <p>Status: {status}</p>
        {#if error}<p class="text-red-500">{error}</p>{/if}
    </div>
</div>