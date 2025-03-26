<!-- <script>
    import UserInfoBasic from '$lib/supabase/userarea/UserinfoBasic.svelte';
</script>


<div class="px-4 py-12">
    <h1>
        Dashboard
    </h1>
    
    <UserInfoBasic />
</div> -->

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