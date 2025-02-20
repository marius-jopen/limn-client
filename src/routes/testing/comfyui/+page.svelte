<script>
    import Run from '../../../lib/runpod/run.svelte';  
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/health-check.svelte';
</script>

<h1 class="px-4 py-4">
    ComfyUI
</h1>

<HealthCheck service="comfyui" />
<Run service="comfyui" workflow_name="comfyui-test" />
<ImagesByService service="comfyui" />