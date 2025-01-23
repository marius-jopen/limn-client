<script>
    import { onMount } from 'svelte';

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

<div class="p-4 rounded-lg bg-gray-100">
    <div class="flex justify-between items-center mb-4">
        <h1>Deforum RunPod Health Status</h1>
        <button 
            on:click={checkHealth} 
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700 cursor-pointer border-none"
        >
            Refresh Status
        </button>
    </div>
    {#if error}
        <p class="text-red-600">Error: {error}</p>
    {:else}
        <p class="text-green-600">Status: {status}</p>
        {#if data}
            <div class="mt-4 p-4 bg-gray-50 rounded overflow-x-auto">
                <h4>Complete Response Data:</h4>
                <pre class="m-0 whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
            </div>
        {/if}
    {/if}
</div>
