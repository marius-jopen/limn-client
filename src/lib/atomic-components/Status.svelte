<script>
    export let status;
</script>

{#if status}
    <p class="text-green-600">
        Status: {status}
    </p> 
{/if}