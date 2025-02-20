<script>
    import { user } from '../stores/store-supabase';
</script>

<div class="px-4">
    {#if $user}
        <p>User ID: {$user.id}</p>
    {/if}
</div>