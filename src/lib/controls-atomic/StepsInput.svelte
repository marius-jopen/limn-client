<script>
    export let imageDefaultParams;
</script>

<div class="flex flex-col gap-2 w-1/4 pb-4">
    <label class="text-xs block" for="prompt">
        Steps
    </label>
      
    <input
        class="text-input"
        type="text"
        bind:value={imageDefaultParams.steps}
        placeholder="Enter steps"
    />
</div>