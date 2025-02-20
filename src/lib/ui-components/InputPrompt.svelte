<script>
    import Label from "../atoms/Label.svelte";
    import Textarea from "../atoms/Textarea.svelte";

    export let label = "";
    export let value = "";
    export let id = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    <Textarea {id} bind:value />
</div> 