<script>
  import NavigationItem from './navigation-item.svelte';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Logout from '$lib/supabase/userarea/Logout.svelte';
  // import Button from '$lib/atoms/Button.svelte';

  const dispatch = createEventDispatcher();
  
  // You can control when the overlay is shown with this variable
  export let isOpen = false;
  
  // Navigation items array without delay (we'll calculate it in the loop)
  const navigationItems = [
    {
      href: '/dashboard',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg',
      imageAlt: 'Dashboard',
      title: 'Dashboard',
    },
    {
      href: '/studio/comfyui',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/abstract.jpg',
      imageAlt: 'Abstract',
      title: 'ComfyUI',
    },
    {
      href: '/studio/comfyui-flux',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/fashion.png',
      imageAlt: 'Fashion',
      title: 'ComfyUI Flux',
    },
    {
      href: '/studio/a1111',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/grab.png',
      imageAlt: 'Grab',
      title: 'A1111',
    },
    {
      href: '/studio/deforum',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/cat.png',
      imageAlt: 'Cat',
      title: 'Deforum',
    },
    {
      href: '/studio/latent-shift',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/glass.png',
      imageAlt: 'Glass',
      title: 'Latent Shift',
    },
    {
      href: '/studio/output',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/nz.png',
      imageAlt: 'Nz',
      title: 'Output',
    }
  ];
  
  // Base delay and increment values (in milliseconds)
  const baseDelay = 200;
  const delayIncrement = 100;
  
  // Number of items per row
  const itemsPerRow = 3;
  
  // Function to chunk array into rows of specified size
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  
  // Split navigation items into rows
  const navigationRows = chunkArray(navigationItems, itemsPerRow);
  
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
        <div class="flex flex-col gap-8">
            {#each navigationRows as row, rowIndex}
                <div class="flex flex-row gap-8">
                    {#each row as item, colIndex}
                        <div in:fade={{ duration: 800, delay: baseDelay + ((rowIndex * itemsPerRow + colIndex) * delayIncrement) }}>
                            <NavigationItem 
                                href={item.href}
                                imageSrc={item.imageSrc}
                                imageAlt={item.imageAlt}
                                title={item.title}
                                on:navigate={handleNavigate}
                            />
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    </div>

    <div class="absolute top-3 left-4">
        <Logout on:logout={handleLogout} />
    </div>
  </div>
{/if}