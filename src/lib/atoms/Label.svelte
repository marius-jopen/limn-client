<script lang="ts">
    export let for_id: string = '';
    export let label: string = '';
</script>

{#if label}
    <label for={for_id} class="font-medium">
        {label}
    </label>
{/if} 