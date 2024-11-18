<script>
  import { user } from '$lib/stores/auth';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Track if we're still loading the initial session
  $: isLoading = typeof $user === 'undefined';
  
  // Debug logs
  $: console.log('Sidebar - State:', {
    user: $user,
    pageSession: $page.data.session?.user,
    isLoading,
    timestamp: new Date().toISOString()
  });

  async function signOut() {
    await supabase.auth.signOut();
    await goto('/');
  }
</script>

<div class="h-screen flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
  {#key $page.data.session?.user?.id || $user?.id}
    <div class="flex h-16 shrink-0 items-center border-b border-gray-200 pb-4">
      <div class="text-xl font-bold pt-4">
        Limn
      </div>
    </div>
    <nav class="flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" class="-mx-2 space-y-1">
            {#if !$user}
              <!-- Not logged in navigation -->
              <li>
                <a href="/" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600">
                  Home
                </a>
              </li>
            {:else}
              <!-- Logged in navigation -->
              <li>
                <a href="/dashboard" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/generate-image-1111" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600">
                  Generate Image 1111
                </a>
              </li>
              <!-- <li>
                <a href="/generate-deforum-1111-runpod-pod" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600">
                  Generate Video Deforum
                </a>
              </li> -->
            {/if}
          </ul>
        </li>
        
        {#if $user}
          <li class="-mx-6 mt-auto">
            <div class="px-6 py-3 text-sm/6 font-semibold text-gray-900">
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
        {:else}
          <li class="-mx-6 mt-auto pb-2">
            <div class="mx-6 py-3 text-sm/6 font-semibold text-gray-900 flex gap-4 border-t border-gray-200 pt-6">
              <a href="/auth/signin" class="button">
                Sign In
              </a>
              
              <a href="/auth/signup" class="button">
                Sign Up
              </a>
            </div>
          </li>
        {/if}
      </ul>
    </nav>
  {/key}
</div>
