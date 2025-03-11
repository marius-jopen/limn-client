<script>
  import NavigationItem from './navigation-item.svelte';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // You can control when the overlay is shown with this variable
  export let isOpen = false;
  
  function handleNavigate(event) {
    console.log("Navigation event received in overlay:", event.detail.href);
    dispatch('navigate', event.detail);
  }
</script>

{#if isOpen}
  <div 
    class="z-10 bg-neutral-100/80 backdrop-blur-2xl w-screen h-screen top-0 left-0 fixed"
    transition:fade={{ duration: 300 }}
  >
    <div class="flex justify-center items-center h-full">
        <div class="flex flex-row gap-8">
            <div in:fade={{ duration: 800, delay: 200 }}>
                <NavigationItem 
                    href="/studio/deforum-limn"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg"
                    imageAlt="Sandbox"
                    title="Sandbox"
                    on:navigate={handleNavigate}
                />
            </div>
            
            <div in:fade={{ duration: 800, delay: 600 }}>
                <NavigationItem 
                    href="/studio/deforum"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/fashion.png"
                    imageAlt="Fashion"
                    title="Fashion"
                    on:navigate={handleNavigate}
                />
            </div>

            <div in:fade={{ duration: 800, delay: 1000 }}>
                <NavigationItem 
                    href="/studio/comfyui-flux"
                    imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/abstract.jpg"
                    imageAlt="Abstract"
                    title="Abstract"
                    on:navigate={handleNavigate}
                />
            </div>
        </div>
    </div>
  </div>
{/if}