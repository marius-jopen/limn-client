<script>
    import Label from '../../../atoms/Label.svelte';
    import Input from '../../../atoms/InputText.svelte';

    export let id;
    export let label;
    export let value;
    export let placeholder = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    <Input {id} bind:value {placeholder} />
</div> 