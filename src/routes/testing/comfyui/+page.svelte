<script>
    import ComfyUIHealthCheck from '../../../lib/services/comfyui/health-check.svelte';
    import ComfyUIRun from '../../../lib/services/comfyui/run.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
</script>

<h1 class="px-4 py-4">
    ComfyUI
</h1>

<ComfyUIHealthCheck />
<ComfyUIRun />
<ImagesByService service="comfyui" />