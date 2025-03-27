<script>
  import NavigationItem from './navigation-item.svelte';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Logout from '$lib/supabase/userarea/Logout.svelte';
  import { supabase } from '$lib/supabase/helper/SupabaseClient';
  import { onMount } from 'svelte';
  // import Button from '$lib/atoms/Button.svelte';

  const dispatch = createEventDispatcher();
  
  // You can control when the overlay is shown with this variable
  export let isOpen = false;
  
  // Add state to track app source and admin status
  let appSource = '';
  let isAdmin = false;
  
  // Navigation items array with explicit visibility rules
  const allNavigationItems = [
    {
      href: '/dashboard',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/sandbox.jpg',
      imageAlt: 'Dashboard',
      title: 'Dashboard',
      visibleTo: ['limn', 'admin'] // Visible to limn users and admins
    },
    {
      href: '/studio/comfyui',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/abstract.jpg',
      imageAlt: 'Abstract',
      title: 'ComfyUI',
      visibleTo: ['admin'] // Only visible to admins
    },
    {
      href: '/studio/comfyui-flux',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/fashion.png',
      imageAlt: 'Fashion',
      title: 'ComfyUI Flux',
      visibleTo: ['admin'] // Only visible to admins
    },
    {
      href: '/studio/a1111',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/grab.png',
      imageAlt: 'Grab',
      title: 'A1111',
      visibleTo: ['admin'] // Only visible to admins
    },
    {
      href: '/studio/deforum',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/cat.png',
      imageAlt: 'Cat',
      title: 'Deforum',
      visibleTo: ['admin'] // Only visible to admins
    },
    {
      href: '/studio/latent-shift',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/latent.png',
      imageAlt: 'Glass',
      title: 'Latent Shift',
      visibleTo: ['limn', 'admin'] // Visible to limn users and admins
    },
    {
      href: '/studio/output',
      imageSrc: 'https://limn-data.s3.eu-central-1.amazonaws.com/ui/navigation/nz.png',
      imageAlt: 'Nz',
      title: 'Output',
      visibleTo: ['admin'] // Only visible to admins
    }
  ];
  
  // Simplified filter logic that uses the visibleTo property
  $: navigationItems = allNavigationItems.filter(item => {
    if (isAdmin) {
      // Admins see everything marked as visible to admins
      return item.visibleTo.includes('admin');
    } else if (appSource === 'limn') {
      // Limn users see only items marked as visible to limn
      return item.visibleTo.includes('limn');
    } else {
      // Regular users see nothing (or you could add a default set of items)
      return false; // No items visible to regular users
    }
  });
  
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
  $: navigationRows = chunkArray(navigationItems, itemsPerRow);
  
  function handleNavigate(event) {
    console.log("Navigation event received in overlay:", event.detail.href);
    dispatch('navigate', event.detail);
  }
  
  function handleLogout() {
    console.log("Logout event received in overlay");
    dispatch('navigate', { href: '/' });
  }
  
  // Add debugging helper
  function debugLog(message, data) {
    console.log(`%c${message}`, 'background: #333; color: #bada55', data);
  }
  
  // Load user metadata and admin status on mount
  onMount(async () => {
    try {
      debugLog("Navigation overlay mounting", { isOpen });
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      debugLog("Auth user data", userData);
      
      if (userError) {
        console.error("Error getting user:", userError);
        return; // Exit early if there's an error getting the user
      }
      
      if (userData?.user) {
        debugLog("User ID", userData.user.id);
        
        try {
          // Check if user is admin with better error handling
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', userData.user.id);
          
          debugLog("Admin check", { data: adminData, error: adminError });
          
          // Set admin status (default to false if there's an error)
          isAdmin = adminData && adminData.length > 0 ? true : false;
          debugLog("Is admin", isAdmin);
        } catch (adminError) {
          console.error("Error checking admin status:", adminError);
          isAdmin = false; // Default to not admin if there's an error
        }
        
        try {
          // Get user settings - now our primary source of app_source
          const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('app_source')
            .eq('id', userData.user.id);
          
          debugLog("User settings", { data: settingsData, error: settingsError });
          
          if (settingsData && settingsData.length > 0 && settingsData[0].app_source) {
            appSource = settingsData[0].app_source;
            debugLog("App source set from settings table to", appSource);
          } else {
            // If no data in settings or app_source is empty, provide a default
            appSource = '';
            debugLog("No app_source found in settings, using default empty value", appSource);
          }
        } catch (settingsError) {
          console.error("Error fetching user settings:", settingsError);
          appSource = '';
          debugLog("Error getting app_source, using default empty value", appSource);
        }
        
        // Debug what items should be shown
        const itemsToShow = allNavigationItems.filter(item => {
          if (isAdmin) {
            return item.visibleTo.includes('admin');
          } else if (appSource === 'limn') {
            return item.visibleTo.includes('limn');
          } else {
            return false;
          }
        });
        
        debugLog("Items that should be shown", itemsToShow.map(i => i.title));
      } else {
        debugLog("No user found in session", null);
        isAdmin = false;
        appSource = '';
      }
    } catch (error) {
      console.error('Error in navigation overlay mount:', error);
      isAdmin = false;
      appSource = '';
    }
  });
  
  // Debug changes to reactive values
  $: {
    if (isOpen) {
      debugLog("Reactive update - Navigation state", { 
        isAdmin, 
        appSource, 
        isOpen,
        itemCount: navigationItems.length 
      });
    }
  }
</script>

{#if isOpen}
  <div 
    class="z-40 bg-neutral-100/80 backdrop-blur-2xl w-screen h-screen top-0 left-0 fixed"
    transition:fade={{ duration: 300 }}
  >
    <!-- Fixed Logout button container -->
    <div class="fixed top-3 left-4 z-50">
        <Logout on:logout={handleLogout} />
    </div>

    <!-- Scrollable content area -->
    <div class="h-full overflow-y-auto">
        <div class="flex justify-center items-center min-h-full py-16">
            <div class="flex flex-col gap-8 p-4 w-full md:w-auto">
                {#each navigationRows as row, rowIndex}
                    <div class="flex flex-col md:flex-row gap-12">
                        {#each row as item, colIndex}
                            <div class="w-full md:w-auto" in:fade={{ duration: 800, delay: baseDelay + ((rowIndex * itemsPerRow + colIndex) * delayIncrement) }}>
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
    </div>
  </div>
{/if}