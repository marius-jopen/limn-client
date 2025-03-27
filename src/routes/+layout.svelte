<script lang="ts">
    import "../app.css";
    import Navigation from '$lib/layout/Navigation.svelte';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';
    import { goto } from '$app/navigation';

    // Export the data prop here
    export let data;
    
    const protectedFromAuthenticatedUsers = ['/', '/login', '/register'];

    onMount(async () => {
        initializeAuth(supabase);
        const { data } = await supabase.auth.getSession();
        
        if (data.session && protectedFromAuthenticatedUsers.includes(window.location.pathname)) {
            console.log('Authenticated user accessing protected route, redirecting to dashboard');
            goto('/dashboard');
        }
    });
    
    // Now you can access data.user, data.isAdmin, and data.appSource in all pages
</script>

<main>
    <Navigation />  

    <slot></slot>
</main>