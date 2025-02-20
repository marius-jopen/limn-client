<script lang="ts">
    import "../app.css";
    import Navigation from '$lib/layout/navigation.svelte';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/helper/supabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/store-supabase';

    onMount(() => {
        initializeAuth(supabase);
    });
</script>

<main>
    <Navigation />  

    <slot></slot>
</main>