<script>
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import GalleryDeforumImages from '$lib/supabase/media/GalleryDeforumImages.svelte';
    import UI_CONFIG from '$lib/workflows/deforum/DeforumBasicConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumBasic.json';
    import Cancel from '$lib/runpod/api/Cancel.svelte';
</script>

<div class="p-4">
    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-1/2">
            <DeforumRun 
                workflow_name="deforum-limn"
                ui_config={UI_CONFIG}
                workflow={WORKFLOW}
            />
            <Cancel />
        </div>
        
        <div class="md:w-1/2">
            <GalleryDeforumImages 
                type={["generated"]} 
                workflow_names={["deforum-limn"]} 
                defaultImagesPerRow={8}
            />       
        </div>
    </div>
</div>