<script lang="ts">
    import "../app.css";
    import Navigation from '$lib/layout/Navigation.svelte';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';

    onMount(() => {
        initializeAuth(supabase);
    });
</script>

<main>
    <Navigation />  

    <slot></slot>
</main>