<script>
    import "../app.css";
    import Sidebar from "../lib/sidebar.svelte";
  </script>


<main class="flex">
    <div>
        <Sidebar />
    </div>
    
    <div class="px-4 py-6 w-full">
        <slot></slot>
    </div>
</main>