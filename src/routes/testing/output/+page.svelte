<script>
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import DeforumVideos from '../../../lib/supabase/deforum-videos.svelte';
</script>

<div class="p-4">
    <h1>Output</h1>
    
    <ImagesByService workflow_name="a1111-test" />
    <ImagesByService workflow_name="comfyui-test" />
    <ImagesByService workflow_name="comfyui-flux" />
    <DeforumVideos workflow_name="deforum-test" />
    <ImagesByService workflow_name="deforum-test" />
</div>