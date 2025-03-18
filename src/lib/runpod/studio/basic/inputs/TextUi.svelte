<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import Input from '$lib/atoms/Input.svelte';

    export let id: string = '';
    export let label: string = '';
    export let value: string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
</script>

<div class="flex flex-col gap-1">
    <Label for_id={id} {label} />
    <Input {id} bind:value {placeholder} {disabled} />
</div> 