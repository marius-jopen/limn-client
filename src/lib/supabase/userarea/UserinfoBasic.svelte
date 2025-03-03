<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
</script>

{#if $user}
    <p>User ID: {$user.id}</p>
{/if}