<script>
    import { user } from '../../lib/stores/auth';
</script>

<div class="px-4">
    {#if $user}
        <p>User ID: {$user.id}</p>
    {/if}
</div>