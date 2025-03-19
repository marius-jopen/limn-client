<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import Boolean from '$lib/atoms/Boolean.svelte';

    export let id: string = '';
    export let label: string = '';
    export let value: boolean = false;
    export let disabled: boolean = false;
    export let hidden: boolean = false;
</script>

<div class="flex flex-col gap-1 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <Boolean {id} bind:value {disabled} />
    {#if value}
        <span class="text-sm text-green-600 font-medium mt-1">true</span>
    {/if}
</div> 