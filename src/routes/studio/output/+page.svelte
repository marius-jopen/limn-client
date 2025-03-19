<script>
    import Gallery from '$lib/supabase/studio/basic/Gallery.svelte';
    import GalleryDeforum from '$lib/supabase/studio/basic/GalleryDeforum.svelte';
    import VideosDeforum from '$lib/supabase/studio/basic/VideosDeforum.svelte';
</script>

<div class="px-4 pt-16">
    <h1>Output</h1>

    <Gallery 
        type={["uploaded"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["comfyui-test"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["comfyui-flux"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["a1111-test"]} 
        defaultImagesPerRow={8}
    />  

    <VideosDeforum workflow_names={["deforum-basic"]} />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-basic"]} 
        defaultImagesPerRow={8}
    />  

    <VideosDeforum workflow_names={["deforum-init"]} />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-init"]} 
        defaultImagesPerRow={8}
    />  

    <VideosDeforum workflow_names={["deforum-limn"]} />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-limn"]} 
        defaultImagesPerRow={8}
    />  

    <VideosDeforum workflow_names={["deforum-limn-init"]} />

    <GalleryDeforum 
        type={["generated"]} 
        workflow_names={["deforum-limn-init"]} 
        defaultImagesPerRow={8}
    />  
</div>