<script>
    import DeforumRun from '$lib/runpod/api/DeforumRun.svelte';  
    import UI_CONFIG from '$lib/workflows/deforum/DeforumLatentShiftConfig.json';
    import WORKFLOW from '$lib/workflows/deforum/DeforumLatentShift.json';
    import ContinuousDeforum from '$lib/supabase/studio/latent-shift/ContinuousDeforum.svelte';
</script>

<div class="pt-16">
    <DeforumRun 
        workflow_name="deforum-latent-shift"
        ui_config={UI_CONFIG}
        workflow={WORKFLOW}
        inputLayout="controller-latent-shift"
    />

    <ContinuousDeforum workflow_names={["deforum-latent-shift"]} />
</div>