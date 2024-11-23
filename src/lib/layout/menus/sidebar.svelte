<script>
  import { user } from '$lib/stores/auth';
  import { page } from '$app/stores';
  
  export let signOut;
  export let closeMobileMenu;
  export let isCollapsed;
</script>

<div class="fixed inset-0 flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white transition-all duration-300 {isCollapsed ? 'px-2 w-16' : 'px-6 w-full'} lg:relative lg:h-[100dvh] lg:min-h-screen lg:{isCollapsed ? 'w-16' : 'w-64'}">
  <div class="flex h-16 shrink-0 items-center justify-between">
    <div class="flex justify-between w-full {isCollapsed ? 'flex-col pt-8' : 'flex-row'}">
      <a href="/" class="{isCollapsed ? 'mx-auto' : ''}">
        <img class="h-8 w-auto" src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company">
      </a>
      
      <!-- Add toggle button -->
      <button 
        on:click={() => isCollapsed = !isCollapsed}
        class="hidden lg:block text-gray-500 hover:text-gray-900 {isCollapsed ? 'mx-auto mt-4' : ''}"
      >
        {#if isCollapsed}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
  
  <nav class="flex flex-1 flex-col">
    <ul role="list" class="flex flex-1 flex-col gap-y-7 {isCollapsed ? 'pt-8' : ''}">
      <li>
        <ul role="list" class="-mx-2 space-y-1">
          <li>
            <a 
              href="/dashboard" 
              on:click={closeMobileMenu}
              class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold {$page.url.pathname === '/dashboard' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'}"
            >
              <span class="material-icons {isCollapsed ? 'mx-auto' : ''}">dashboard</span>
              {#if !isCollapsed}Dashboard{/if}
            </a>
          </li>
          <li>
            <a 
              href="/generate-image-1111" 
              on:click={closeMobileMenu}  
              class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold {$page.url.pathname === '/generate-image-1111' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'}"
            >
              <span class="material-icons {isCollapsed ? 'mx-auto' : ''}">image</span>
              {#if !isCollapsed}Generate Image 1111{/if}
            </a>
          </li>
        </ul>
      </li>
      
      <li class="{isCollapsed ? '-mx-2' : '-mx-6'} mt-auto">
        <div class="px-6 py-3 text-sm/6 font-semibold text-gray-900 {isCollapsed ? 'hidden' : ''}">
          <div class="text-xs border-b border-gray-200 pb-4 mb-5">
            {$user.email}
          </div>

          <button 
            on:click={() => signOut()} 
            class="button mb-2"
          >
            Logout
          </button>
        </div>
      </li>
    </ul>
  </nav>
</div>
