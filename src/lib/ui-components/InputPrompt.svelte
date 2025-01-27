<script>
    import Label from "../atomic-components/Label.svelte";
    import Textarea from "../atomic-components/Textarea.svelte";

    export let label = "";
    export let value = "";
    export let id = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    <Textarea {id} bind:value />
</div> 