<script>
    import ComfyUIHealthCheck from '$lib/services/comfyui/health-check.svelte';
    import ComfyUIRun from '$lib/services/comfyui/run.svelte';
    import ImagesFromUser from '$lib/supabase/images-from-user.svelte';
</script>

<h1 class="px-4 py-4">
    ComfyUI
</h1>

<ComfyUIHealthCheck />
<ComfyUIRun />
<ImagesFromUser service="comfyui" />
