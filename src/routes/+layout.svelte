<script>
    import "../app.css";
    import Navigation from "$lib/layout/navigation.svelte";
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';

    // Debug logs
    $: console.log('Layout - Page Session:', {
        session: $page.data.session,
        user: $page.data.session?.user,
        timestamp: new Date().toISOString()
    });

    // Only set user if we have session data
    $: if ($page.data.session?.user) {
        console.log('Layout - Setting user store:', $page.data.session.user);
        user.set($page.data.session.user);
    }
</script>

<div>
    <Navigation />
    
    <main class="lg:pl-72">
        <slot></slot>
    </main>
</div>