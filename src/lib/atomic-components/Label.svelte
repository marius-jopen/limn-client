<script>
    export let for_id = '';
    export let label = '';
</script>

{#if label}
    <label for={for_id} class="font-medium">
        {label}
    </label>
{/if} 