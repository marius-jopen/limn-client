<script>
    import AspectRatioDropdown from '$lib/controls-atomic/AspectRatioDropdown.svelte';
    import PromptInput from '$lib/controls-atomic/PromptsInput.svelte';
    import NegativePromptInput from '$lib/controls-atomic/NegativePromptsInput.svelte';
    import StepsInput from '$lib/controls-atomic/StepsInput.svelte';

    export let imageDefaultParams;
</script>

<div class="pt-8 mt-8 border-t border-gray-200">
    <PromptInput {imageDefaultParams} />
    <NegativePromptInput {imageDefaultParams} />
    
    <div class="flex gap-4">
        <StepsInput {imageDefaultParams} />
        <AspectRatioDropdown {imageDefaultParams} />
    </div>
</div>