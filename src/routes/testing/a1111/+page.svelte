<script>
    import A1111Run from '$lib/services/a1111/run.svelte';
    import GalleryImages from '$lib/supabase/media/GalleryImages.svelte';
</script>

<h1 class="px-4 py-4">
    A1111
</h1>

<A1111Run />
<GalleryImages service="a1111" />