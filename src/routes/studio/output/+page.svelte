<script>
    import Gallery from '$lib/supabase/media/Gallery.svelte';
    import VideosDeforum from '$lib/supabase/media/VideosDeforum.svelte';
</script>

<div class="p-4">
    <h1>Output</h1>

    <VideosDeforum workflow_names={["deforum-init"]} />
    
    <VideosDeforum workflow_names={["deforum-basic"]} />

    <VideosDeforum workflow_names={["deforum-limn-init"]} />
    
    <VideosDeforum workflow_names={["deforum-limn"]} />
    
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

    <Gallery 
        type={["generated"]} 
        workflow_names={["deforum-init"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["deforum-basic"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["deforum-limn-init"]} 
        defaultImagesPerRow={8}
    />  

    <Gallery 
        type={["generated"]} 
        workflow_names={["deforum-limn"]} 
        defaultImagesPerRow={8}
    />  
</div>