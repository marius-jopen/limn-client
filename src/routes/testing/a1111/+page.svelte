<script>
    import A1111HealthCheck from '../../../lib/services/a1111/health-check.svelte';
    import A1111Run from '../../../lib/services/a1111/run.svelte';
    import ImagesByService from '../../../lib/supabase/images-by-service.svelte';
</script>

<h1 class="px-4 py-4">
    A1111
</h1>

<A1111HealthCheck />
<A1111Run />
<ImagesByService service="a1111" />