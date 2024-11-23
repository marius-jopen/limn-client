<script>
    import "../app.css";
    import Navigation from "$lib/layout/menus/navigation.svelte";
    import MainNavigation from "$lib/layout/menus/MainNavigation.svelte";
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase/supabaseClient';

    // Set user when session data is available
    $: if ($page.data.session?.user) {
        user.set($page.data.session.user);
    }

    async function signOut() {
        await supabase.auth.signOut();
        user.set(null);
        await goto('/');
    }
</script>

<div>
    {#if $user}
        <Navigation {signOut} />
        
        <main class="lg:pl-72">
            <slot></slot>
        </main>
    {:else}
        <MainNavigation />

        <main>
            <slot></slot>
        </main>
    {/if}
</div>