<script>
    import A1111Run from '../../../lib/services/a1111/run.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
    import HealthCheck from '../../../lib/runpod/health-check.svelte';
</script>

<h1 class="px-4 py-4">
    A1111
</h1>

<HealthCheck service="a1111" />
<A1111Run />
<ImagesByService service="a1111" />