<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import Header from '$lib/layout/header.svelte';

    let user = null;

    onMount(async () => {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user;
        console.log('User ID:', user?.id);
    });
</script>

<div class="px-8">
    <Header text="Dashboard" />

    {#if user}
        <p class="mb-4">Welcome, {user.email}</p>
        <p class="mb-4">User ID: {user.id}</p>
    {:else}
        <p>Loading...</p>
    {/if}
</div> 