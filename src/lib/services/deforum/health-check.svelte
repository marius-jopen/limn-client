<script>
    import { onMount } from 'svelte';
    import JsonViewer from '../../ui-components/JsonViewer.svelte';
    import Button from '../../atomic-components/Button.svelte';
    import Error from '../../atomic-components/Error.svelte';
    import Status from '../../atomic-components/Status.svelte';

    let status = 'Loading...';
    let error = null;
    let data = null;

    async function checkHealth() {
        try {
            const response = await fetch('http://localhost:4000/api/deforum-runpod-serverless-health');
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
            Deforum RunPod Health Status
        </h2>

        {#if error}
            <Error message={error} />
        {:else}
            <Status {status} />
            
            {#if data}
                <JsonViewer id="health-check-data" label="Complete Response Data" {data} />
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