<script>
    import Sidebar from "$lib/layout/menus/sidebar.svelte";
    
    // Add state for mobile menu
    let isMobileMenuOpen = false;
    
    // Toggle handlers
    const openMobileMenu = () => isMobileMenuOpen = true;
    const closeMobileMenu = () => isMobileMenuOpen = false;

    // Add signOut prop
    export let signOut;
    export let isCollapsed;
    export let toggleCollapse;
</script>

<div>
    <!-- Mobile menu -->
    <div 
        class="fixed inset-0 z-[50] lg:hidden" 
        role="dialog" 
        aria-modal="true"
        class:hidden={!isMobileMenuOpen}
    >
        <Sidebar 
            {signOut} 
            bind:isCollapsed 
            {closeMobileMenu}
        />
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex {isCollapsed ? 'lg:w-16' : 'lg:w-72'}   lg:flex-col">
        <Sidebar 
            {signOut} 
            bind:isCollapsed 
            {closeMobileMenu}
        />
    </div>

    <!-- Mobile header -->
    <div class="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <!-- Logo -->
        <a href="/" class="flex-shrink-0">
            <img class="h-8 w-auto" src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company">
        </a>

        <button 
            type="button" 
            class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            on:click={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
        >
            <span class="sr-only">{isMobileMenuOpen ? 'Close sidebar' : 'Open sidebar'}</span>
            {#if isMobileMenuOpen}
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            {:else}
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            {/if}
        </button>
    </div>

    <!-- Add a spacer div for mobile -->
    <div class="h-[4rem] lg:hidden"></div>
</div>