<script>
    import Label from '../../../atoms/Label.svelte';
    import Input from '../../../atoms/Input.svelte';

    export let id = '';
    export let label = '';
    export let value = '';
    export let placeholder = '';
    export let disabled = false;
</script>

<div class="flex flex-col gap-1">
    <Label for_id={id} {label} />
    <Input {id} bind:value {placeholder} {disabled} />
</div> 