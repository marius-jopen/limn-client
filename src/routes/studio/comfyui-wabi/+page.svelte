<script>
    import ComfyuiRun from '$lib/runpod/api/ComfyuiRun.svelte';  
    import Gallery from '$lib/supabase/studio/wabi/Gallery.svelte';
    import UI_CONFIG from '$lib/workflows/comfyui/ComfyuiWabiConfig.json';
    import WORKFLOW from '$lib/workflows/comfyui/ComfyuiWabi.json';
    import PreviewImages from '$lib/runpod/studio/wabi/components/PreviewImages.svelte';
    import OpenAiRun from '$lib/openai/api/Openai-run.svelte';
</script>

<div class="px-4 pt-16">
    <div class="md:w-10/12 mx-auto">
        <div class="">
            <PreviewImages />

            <ComfyuiRun 
                service="comfyui" 
                workflow_name="comfyui-wabi"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
                inputLayout="controller-wabi"
            />
        </div>
        
        <div class="">
            <Gallery 
                type={["uploaded", "generated"]} 
                workflow_names={["comfyui-wabi"]} 
                defaultImagesPerRow={5}
            />        
        </div>
    </div>
</div>