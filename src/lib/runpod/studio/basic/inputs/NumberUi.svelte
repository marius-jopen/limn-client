<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import Input from '$lib/atoms/InputText.svelte';

    export let id: string = '';
    export let label: string = '';
    export let value: number | string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
    export let hidden: boolean = false;
</script>

<div class="flex flex-col gap-1 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <Input {id} bind:value {placeholder} {disabled} />
</div> 