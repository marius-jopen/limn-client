<script>
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import DeforumVideos from '../../../lib/supabase/deforum-videos.svelte';
</script>

<h1 class="px-4 py-4">
    Output
</h1>

<ImagesByService service="a1111" />
<ImagesByService service="comfyui" />
<ImagesByService service="comfyui-flux" />
<DeforumVideos service="deforum" />