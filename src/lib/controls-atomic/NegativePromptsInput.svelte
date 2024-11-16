<script>
    export let imageDefaultParams;
</script>

<div class="flex flex-col gap-2 w-1/2">
    <label class="text-xs block" for="prompt">
        Negative Prompt
    </label>
    
    <textarea
        class="text-input block w-full"
        bind:value={imageDefaultParams.negative_prompt}
        placeholder="Enter your negative prompt"
        rows="3"
    ></textarea>
</div>