<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
</script>

<div class="px-4">
    {#if $user}
        <p>User ID: {$user.id}</p>
    {/if}
</div>