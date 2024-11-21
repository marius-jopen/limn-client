<script>
  import { user } from '$lib/stores/auth';
  
  export let signOut;
</script>

<div class="min-h-screen h-[100dvh] flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
  <div class="flex h-16 shrink-0 items-center border-b border-gray-200 pb-4">
    <div class="text-xl font-bold pt-4">
      Limn
    </div>
  </div>
  <nav class="flex flex-1 flex-col">
    <ul role="list" class="flex flex-1 flex-col gap-y-7">
      <li>
        <ul role="list" class="-mx-2 space-y-1">
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
        </ul>
      </li>
      
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
    </ul>
  </nav>
</div>
