<script>
    import "../app.css";
    import Navigation from "$lib/layout/navigation.svelte";
</script>

<div>
    <Navigation />
    
    <main class="lg:pl-72">
        <slot></slot>
    </main>
</div>