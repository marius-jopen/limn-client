<script>
    import Label from '../atomic-components/Label.svelte';
    import Input from '../atomic-components/Input.svelte';

    export let id;
    export let label;
    export let value;
    export let placeholder = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    <Input {id} bind:value {placeholder} />
</div> 