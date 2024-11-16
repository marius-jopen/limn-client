<script>
    import "../app.css";
    import Navigation from "$lib/layout/navigation.svelte";
</script>

<div>
    <Navigation />
    
    <main class="py-10 lg:pl-72">
        <div class="px-4 sm:px-6 lg:px-8">
            <slot></slot>
        </div>
    </main>
</div>