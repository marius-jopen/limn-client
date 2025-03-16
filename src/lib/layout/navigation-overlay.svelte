<script>
  import NavigationItem from './navigation-item.svelte';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Logout from '$lib/supabase/userarea/Logout.svelte';
  // import Button from '$lib/atoms/Button.svelte';

  const dispatch = createEventDispatcher();
  
  // You can control when the overlay is shown with this variable
  export let isOpen = false;
  
  function handleNavigate(event) {
    console.log("Navigation event received in overlay:", event.detail.href);
    dispatch('navigate', event.detail);
  }
  
  function handleLogout() {
    console.log("Logout event received in overlay");
    dispatch('navigate', { href: '/' });
  }
</script>

{#if isOpen}
  <div 
    class="z-40 bg-neutral-100/80 backdrop-blur-2xl w-screen h-screen top-0 left-0 fixed"
    transition:fade={{ duration: 300 }}
  >
    <div class="flex justify-center items-center h-full">
        <div class="flex flex-row gap-8">
            <div in:fade={{ duration: 800, delay: 200 }}>
                <NavigationItem 
                    href="/dashboard"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg"
                    imageAlt="Dashboard"
                    title="Dashboard"
                    on:navigate={handleNavigate}
                />
            </div>
            
            <div in:fade={{ duration: 800, delay: 250 }}>
                <NavigationItem 
                    href="/studio/limn"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/fashion.png"
                    imageAlt="Limn"
                    title="Generator"
                    on:navigate={handleNavigate}
                />
            </div>

            <!-- <div in:fade={{ duration: 800, delay: 300 }}>
                <NavigationItem 
                    href="/studio/comfyui-flux"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/abstract.jpg"
                    imageAlt="Abstract"
                    title="ComfyUI Flux"
                    on:navigate={handleNavigate}
                />
            </div> -->
        </div>
    </div>

    <div class="absolute top-3 left-3">
        <Logout on:logout={handleLogout} />
    </div>
  </div>
{/if}