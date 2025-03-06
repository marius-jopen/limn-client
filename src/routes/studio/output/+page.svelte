<script>
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
    import GalleryDeforumVideos from '$lib/supabase/media/GalleryDeforumVideos.svelte';
</script>

<div class="p-4">
    <h1>Output</h1>

    <GalleryDeforumVideos workflow_names={["deforum-init"]} />
    
    <GalleryDeforumVideos workflow_names={["deforum-basic"]} />
    
    <GalleryImages 
        type={["uploaded"]} 
        defaultImagesPerRow={8}
    />  

    <GalleryImages 
        type={["generated"]} 
        workflow_names={["comfyui-test"]} 
        defaultImagesPerRow={8}
    />  

    <GalleryImages 
        type={["generated"]} 
        workflow_names={["comfyui-flux"]} 
        defaultImagesPerRow={8}
    />  

    <GalleryImages 
        type={["generated"]} 
        workflow_names={["a1111-test"]} 
        defaultImagesPerRow={8}
    />  

    <GalleryImages 
        type={["generated"]} 
        workflow_names={["deforum-init"]} 
        defaultImagesPerRow={8}
    />  

    <GalleryImages 
        type={["generated"]} 
        workflow_names={["deforum-basic"]} 
        defaultImagesPerRow={8}
    />  
</div>