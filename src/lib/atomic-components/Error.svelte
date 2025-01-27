<script>
    export let message;
</script>

{#if message}
    <p class="text-red-600">
        Error: {message}
    </p> 
{/if}