<script lang="ts">
    import "../app.css";
    import Navigation from '$lib/layout/Navigation.svelte';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';

    // Export the data prop here
    export let data;
    
    onMount(() => {
        initializeAuth(supabase);
    });
    
    // Now you can access data.user, data.isAdmin, and data.appSource in all pages
</script>

<main>
    <Navigation />  

    <slot></slot>
</main>