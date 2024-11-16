<script>
    import Sidebar from "$lib/layout/sidebar.svelte";
    
    // Add state for mobile menu
    let isMobileMenuOpen = false;
    
    // Toggle handlers
    const openMobileMenu = () => isMobileMenuOpen = true;
    const closeMobileMenu = () => isMobileMenuOpen = false;
</script>

<div>
    <div 
        class="relative z-50 lg:hidden" 
        role="dialog" 
        aria-modal="true"
        class:hidden={!isMobileMenuOpen}
    >
        <!-- Backdrop -->
        <div 
            class="fixed inset-0 bg-gray-900/80 transition-opacity duration-300"
            class:opacity-0={!isMobileMenuOpen}
            class:opacity-100={isMobileMenuOpen}
            aria-hidden="true"
        ></div>

        <div class="fixed inset-0 flex">
            <!-- Mobile menu -->
            <div 
                class="relative mr-16 flex w-full max-w-xs flex-1 transition-transform duration-300"
                class:translate-x-0={isMobileMenuOpen}
                class:-translate-x-full={!isMobileMenuOpen}
            >
                <!-- Close button -->
                <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button 
                        type="button" 
                        class="-m-2.5 p-2.5"
                        on:click={closeMobileMenu}
                    >
                        <span class="sr-only">Close sidebar</span>
                        <svg class="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <Sidebar />
            </div>
        </div>
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
    </div>

    <!-- Mobile header -->
    <div class="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button 
            type="button" 
            class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            on:click={openMobileMenu}
        >
            <span class="sr-only">Open sidebar</span>
            <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>

        <div class="flex-1 text-sm/6 font-semibold text-gray-900">
            Dashboard
        </div>

        <a href="#">
            <span class="sr-only">Your profile</span>
            <img class="size-8 rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
        </a>
    </div>
</div>