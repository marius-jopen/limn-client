<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import FetchImage from '$lib/supabase/media/FetchImage.svelte';
    import Back from '$lib/layout/helper/Back.svelte';
    
    export let data: PageData;
</script>

<div class="p-4">
    <Back />
    <FetchImage imageId={data.imageId} />
</div>
