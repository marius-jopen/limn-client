<script>
    import DeforumHealthCheck from '$lib/services/deforum/health-check.svelte';
    import DeforumRun from '$lib/services/deforum/run.svelte';
    import ImagesFromUser from '$lib/supabase/images-from-user.svelte';
</script>

<h1 class="px-4 py-4">
    Deforum
</h1>

<DeforumHealthCheck />
<DeforumRun /> 
<ImagesFromUser service="deforum" />
