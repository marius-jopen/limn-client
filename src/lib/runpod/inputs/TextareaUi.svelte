<script lang="ts">
    import Label from "$lib/atoms/Label.svelte";
    import Textarea from "$lib/atoms/InputTextarea.svelte";

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    <Textarea {id} bind:value />
</div> 