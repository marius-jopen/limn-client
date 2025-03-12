<script>
    import DeforumRun from '$lib/runpod/DeforumRun.svelte';  
    import UI_CONFIG from '$lib/workflows/deforum/DeforumLimnConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumLimn.json';
    import PreviewVideo from '$lib/runpod/ui/PreviewVideo.svelte';
    import PreviewImages from '$lib/runpod/ui/PreviewImages.svelte';
    // import LimnGeneratorVertical from '$lib/runpod/ui/limn/limn-generator-vertical.svelte';
    import LimnGeneratorHorizontal from '$lib/runpod/ui/limn/limn-generator-horizontal.svelte';
    // import LatentSpaceExplorer from '$lib/runpod/ui/LatentSpaceExplorer/LatentSpaceExplorer.svelte';
</script>


<!-- <LatentSpaceExplorer /> -->
<!-- <LimnGeneratorVertical /> -->
 <div class="py-24">
     <LimnGeneratorHorizontal />
     <LimnGeneratorHorizontal />
     <LimnGeneratorHorizontal />
 </div>

<!-- <div class="flex gap-4 flex-col md:flex-row">
    <div class="md:w-1/2">
        <DeforumRun 
            workflow_name="deforum-limn"
            ui_config={UI_CONFIG}
            workflow={WORKFLOW}
        />
    </div>
    
    <div class="md:w-1/2">
        <PreviewVideo />
        <PreviewImages />    
    </div>
</div> -->
