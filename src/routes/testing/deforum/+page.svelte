<script>
    import DeforumRun from '../../../lib/services/deforum/run.svelte';
    import HealthCheck from '../../../lib/runpod/health-check.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import DeforumVideos from '../../../lib/supabase/deforum-videos.svelte';
</script>

<h1 class="px-4 py-4">
    Deforum
</h1>

<HealthCheck service="deforum" />
<DeforumRun /> 
<DeforumVideos service="deforum" />
<ImagesByService service="deforum" />