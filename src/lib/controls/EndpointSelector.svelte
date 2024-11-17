<script>
    export let selectedEndpoint;

    const endpoints = [
        { value: 'generate-image-1111-runpod-local', label: 'Local' },
        { value: 'generate-image-1111-runpod-pod', label: 'RunPod Pod' },
        { value: 'generate-image-1111-runpod-serverless', label: 'RunPod Serverless' }
    ];
</script>

<select 
    bind:value={selectedEndpoint}
    class="select-input select select-bordered w-1/2 max-w-xs"
>
    {#each endpoints as endpoint}
        <option value={endpoint.value}>{endpoint.label}</option>
    {/each}
</select>