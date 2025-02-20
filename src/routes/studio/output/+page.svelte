<script>
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
</script>

<div class="p-4">
    <h1>Output</h1>
    
    <GalleryImages workflow_name="a1111-test" />
    <GalleryImages workflow_name="comfyui-test" />
    <GalleryImages workflow_name="comfyui-flux" />
    <GalleryDeforumVideos workflow_name="deforum-test" />
    <GalleryImages workflow_name="deforum-test" />
</div>