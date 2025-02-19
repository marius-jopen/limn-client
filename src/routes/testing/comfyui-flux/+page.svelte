<script>
    import HealthCheck from '../../../lib/runpod/health-check.svelte';
    import ComfyUIFluxRun from '../../../lib/services/comfyui-flux/run.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
</script>

<h1 class="px-4 py-4">
    ComfyUI Flux
</h1>

<HealthCheck service="comfyui" />
<ComfyUIFluxRun />
<ImagesByService service="comfyui-flux" />