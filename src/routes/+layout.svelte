<script lang="ts">
    import "../app.css";
    import Navigation from '$lib/layout/navigation.svelte';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/supabaseClient';
    import { initializeAuth } from '$lib/stores/auth';

    onMount(() => {
        initializeAuth(supabase);
    });
</script>

<main>
    <Navigation />  

    <slot></slot>
</main>