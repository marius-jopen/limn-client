<script>
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import GalleryDeforum from '$lib/supabase/studio/latent-shift/GalleryDeforum.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
</script>

<div class="pt-16">

    <DeforumRun 
        workflow_name="deforum-limn"
        ui_config={UI_CONFIG}
        workflow={WORKFLOW}
        inputLayout="controller-latent-shift"
    />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-limn"]} 
        defaultImagesPerRow={8}
        batchDisplayMode="latest-only"
    />   

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-limn"]} 
        defaultImagesPerRow={8}
        batchDisplayMode="exclude-latest"
    />  
    
</div>