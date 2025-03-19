<script lang="ts">
    import type { PageData } from '@sveltejs/kit';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import FetchImage from '$lib/supabase/studio/basic/FetchImage.svelte';
    export let data: PageData;

    $: if (data.imageId) {
        $runState = { ...$runState, imageId: data.imageId };
    }
</script>

<div class="px-4 pt-16">
    <h1>
        Fetch Image {data.imageId}
    </h1>

    <FetchImage imageId={data.imageId} />
</div>