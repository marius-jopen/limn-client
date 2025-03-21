<script>
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import GalleryDeforum from '$lib/supabase/studio/pedro/GalleryDeforum.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumPedroConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumPedro.json';
</script>

<div class="pt-16">

    <DeforumRun 
        workflow_name="deforum-pedro"
        ui_config={UI_CONFIG}
        workflow={WORKFLOW}
        inputLayout="controller-pedro"
    />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-pedro"]} 
        defaultImagesPerRow={8}
        batchDisplayMode="latest-only"
    />   

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-pedro"]} 
        defaultImagesPerRow={8}
        batchDisplayMode="exclude-latest"
    />  
    
</div>