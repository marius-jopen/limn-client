<script>
    export let imageDefaultParams;
</script>

<input
    class="text-input"
    type="text"
    bind:value={imageDefaultParams.prompt}
    placeholder="Enter your prompt"
/>

<input
    class="text-input"
    type="text"
    bind:value={imageDefaultParams.steps}
    placeholder="Enter steps"
/>