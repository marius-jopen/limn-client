<script>
    import DeforumHealthCheck from '../../../lib/services/deforum/health-check.svelte';
    import DeforumRun from '../../../lib/services/deforum/run.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
</script>

<h1 class="px-4 py-4">
    Deforum
</h1>

<DeforumHealthCheck />
<DeforumRun /> 
<ImagesByService service="deforum" />