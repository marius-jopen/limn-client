<script>
    export let jobId = null;
</script>

{#if jobId}
    <div class="text-sm text-gray-600">
        Job ID: {jobId}
    </div>
{/if} 