<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    
    // Configuration for pagination
    const IMAGES_PER_PAGE = 40; // Number of images to load initially and on each "Load More" click
    
    // Define interfaces for our data structures
    interface Resource {
        id: string;
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
        visibility?: boolean;
        type?: 'uploaded' | 'generated' | string; // Add type field
    }

    interface RunStateImage {
        url?: string;
        image_url?: string;
    }

    export let workflow_name: string | undefined = undefined;
    export let workflow_names: string[] = [];
    export let type: string | string[] | undefined = undefined;
    export let defaultImagesPerRow: number = 8; // Default number of images per row
    
    // Convert type to array if it's a string
    $: typeArray = typeof type === 'string' ? [type] : Array.isArray(type) ? type : [];
    
    // Grid layout state - fixed based on prop
    $: gridClass = `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${defaultImagesPerRow}`;
    
    // Pagination state
    let allResources: Resource[] = []; // All fetched resources
    let displayedResources: Resource[] = []; // Resources currently displayed
    let displayCount = IMAGES_PER_PAGE; // Number of resources to display
    let hasMoreToLoad = false; // Whether there are more resources to load
    
    // Log props on mount
    onMount(() => {
        console.log('GalleryImages component mounted with props:', {
            workflow_name,
            workflow_names,
            type,
            typeArray,
            defaultImagesPerRow
        });
    });
    
    // Combine both props into a single array for internal use
    $: workflowsToFetch = workflow_name 
        ? [workflow_name] 
        : workflow_names;
        
    $: console.log('workflowsToFetch updated:', workflowsToFetch);
    
    let resources: Resource[] = [];
    let error: string | null = null;
    let selectedImage: Resource | null = null;
    let subscription: any; // Type will depend on your Supabase client type

    $: user_id = $user?.id;

    // Update displayed resources
    $: {
        displayedResources = allResources.slice(0, displayCount);
        
        // Always show the Load More button if we have more resources than currently displayed
        // or if we have exactly IMAGES_PER_PAGE images (which suggests there may be more)
        hasMoreToLoad = allResources.length > displayCount || 
                        (allResources.length === IMAGES_PER_PAGE);
                         
        console.log(`Displaying ${displayedResources.length} resources, hasMoreToLoad: ${hasMoreToLoad}`);
    }

    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Function to load more images
    function loadMore() {
        console.log(`Loading more images. Current count: ${displayCount}`);
        displayCount += IMAGES_PER_PAGE;
        
        // If we've displayed all the currently fetched resources, fetch more
        if (displayCount > allResources.length) {
            fetchMoreImages();
        }
    }

    // Helper function to fetch resources from Supabase
    async function fetchResourcesFromSupabase(options) {
        const { 
            offset = 0, 
            limit = IMAGES_PER_PAGE 
        } = options;
        
        try {
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false });
                
            // Add type and workflow filters only if specifically provided in options
            // (Used only for backward compatibility or specific use cases)
            if (options.type) {
                query = query.eq('type', options.type);
            }

            if (options.workflow) {
                query = query.eq('workflow_name', options.workflow);
            }
            
            // Add pagination
            if (offset > 0) {
                query = query.range(offset, offset + limit - 1);
            } else {
                query = query.limit(limit);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error(`Error fetching resources:`, error);
                return [];
            }
            
            console.log(`Fetched ${data?.length || 0} resources`);
            return data || [];
        } catch (e) {
            console.error('Error in fetchResourcesFromSupabase:', e);
            return [];
        }
    }

    // Function to fetch more images beyond the initial batch
    async function fetchMoreImages() {
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return;
            }
            
            console.log('Fetching more images...');
            
            // Use a single query to fetch more images
            const offset = allResources.length;
            const additionalResources = await fetchResourcesFromSupabase({ offset });
            
            if (additionalResources.length > 0) {
                console.log(`Adding ${additionalResources.length} more images to the collection`);
                
                // Add new resources to allResources
                const existingIds = new Set(allResources.map(r => r.id));
                const uniqueNewResources = additionalResources.filter(img => !existingIds.has(img.id));
                
                if (uniqueNewResources.length > 0) {
                    allResources = [...allResources, ...uniqueNewResources];
                    console.log(`Total resources now: ${allResources.length}`);
                    
                    // If we got a full page, there are likely more
                    hasMoreToLoad = additionalResources.length >= IMAGES_PER_PAGE;
                } else {
                    console.log('No new unique resources found');
                    // If we didn't find any new resources, there are no more to load
                    hasMoreToLoad = false;
                }
            } else {
                console.log('No additional resources found');
                hasMoreToLoad = false;
            }
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching more images:', e);
        }
    }

    // Handle runState images immediately
    $: if ($runState.images?.length) {
        const newImages = $runState.images.map(img => ({
            id: crypto.randomUUID(), // Add a random UUID for the id
            image_url: getImageUrl(img),
            user_id: user_id,
            workflow_name: workflow_name,
            created_at: new Date().toISOString()
        }));
        
        // Merge new images with existing ones, avoiding duplicates
        const existingUrls = new Set(allResources.map(r => r.image_url));
        const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.image_url));
        allResources = [...uniqueNewImages, ...allResources];
    }

    // Modify fetchUserImages to use a single query
    async function fetchUserImages() {
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return;
            }
            
            console.log('Fetching user images with simplified query');
            
            // Single query to fetch all resources for the user
            const fetchedResources = await fetchResourcesFromSupabase({});
            
            console.log(`Fetched ${fetchedResources.length} resources`);
            allResources = fetchedResources;
            
            // Check if there are likely more images to load
            hasMoreToLoad = fetchedResources.length >= IMAGES_PER_PAGE;
            console.log(`Setting hasMoreToLoad to ${hasMoreToLoad} based on initial fetch size`);
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

    function setupSubscription() {
        if (subscription) {
            if (Array.isArray(subscription)) {
                subscription.forEach(channel => {
                    if (channel && typeof channel.unsubscribe === 'function') {
                        channel.unsubscribe();
                    }
                });
            } else if (typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        }

        if (user_id) {
            // Create a single subscription for all resource changes
            console.log('Setting up a single subscription for all resource changes');
            
            subscription = supabase
                .channel(`resource_changes_${user_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id}`
                    },
                    () => {
                        fetchUserImages();
                    }
                )
                .subscribe();
        }
    }

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        if (subscription) {
            if (Array.isArray(subscription)) {
                subscription.forEach(channel => {
                    if (channel && typeof channel.unsubscribe === 'function') {
                        channel.unsubscribe();
                    }
                });
            } else if (typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        }
    });

    // Update the reactive statement to include workflowsToFetch
    let initialLoadComplete = false;
    $: {
        if (user_id && !initialLoadComplete) {
            console.log('Initial component setup with props:', {
                workflow_name,
                workflow_names,
                type,
                typeArray
            });
            
            setupSubscription();
            
            // Now fetch images with the props
            allResources = []; // Clear existing resources
            fetchUserImages();
            initialLoadComplete = true;
        }
    }

    // Debug function to check if there are any uploaded images at all
    async function checkForAnyUploadedImages() {
        try {
            console.log('DEBUG: Checking for any uploaded images');
            
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('type', 'uploaded')
                .limit(10);
                
            if (supabaseError) {
                console.error('DEBUG: Supabase error when checking for uploads:', supabaseError);
                return;
            }
            
            console.log('DEBUG: Found uploaded images (regardless of workflow):', data);
        } catch (e) {
            console.error('DEBUG: Error checking for uploads:', e);
        }
    }

    // Function to handle image click
    function handleImageClick(resource: Resource): void {
        selectedImage = resource;
    }

    // Function to close overlay
    function closeOverlay(): void {
        selectedImage = null;
    }

    // Add this function after the closeOverlay function
    async function handleDeleteImage(resource: Resource): Promise<void> {
        try {
            const url = `http://localhost:4000/api/resources/${resource.id}/delete`;
            console.log('Attempting to delete resource at URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Log response details for debugging
            console.log('Response status:', response.status);
            console.log('Response type:', response.headers.get('content-type'));

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete image');
            }

            // Only remove from UI if deletion was successful
            allResources = allResources.filter(r => r.id !== resource.id);
        } catch (e) {
            error = e.message;
            console.error('Error deleting image:', e);
            alert('Failed to delete image: ' + e.message);
        }
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class="grid {gridClass}">
        {#if displayedResources.length > 0}
            {#each displayedResources as resource}
                <div 
                    class="aspect-square overflow-hidden relative group"
                    role="group"
                >
                    <img 
                        src={resource.image_url}
                        alt={resource.name || 'User uploaded image'} 
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center flex-col justify-center gap-2 p-2">
                        <button
                            class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                            on:click={() => handleImageClick(resource)}
                        >
                            Preview
                        </button>
                        <a
                            href={`/studio/${resource.id}`}
                            class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                        >
                            Details
                        </a>
                        <a
                            href={`/studio/deforum/${resource.id}`}
                            class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                        >
                            Deforum
                        </a>
                        <button
                            class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow-md"
                            on:click={() => handleDeleteImage(resource)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            {/each}
        {:else if allResources.length === 0}
            <div class="col-span-full min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                <p class="text-gray-500 text-lg">No images found in your account</p>
            </div>
        {:else}
            <div class="col-span-full min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                <p class="text-gray-500 text-lg">No images to display</p>
            </div>
        {/if}
    </div>
    
    {#if hasMoreToLoad}
        <div class="mt-4 flex justify-center">
            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md"
                on:click={loadMore}
            >
                Load More
            </button>
        </div>
    {/if}
{/if}

{#if selectedImage}
    <div 
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        on:click={closeOverlay}
        on:keydown={(e) => e.key === 'Escape' && closeOverlay()}
        role="button"
        tabindex="0"
    >
        <div 
            class="relative max-w-4xl max-h-[90vh]"
            on:click|stopPropagation={() => {}}
            on:keydown|stopPropagation={() => {}}
            role="presentation"
        >
            <img 
                src={selectedImage.image_url} 
                alt={selectedImage.name || 'User uploaded image'} 
                class="max-w-full max-h-[90vh] object-contain"
            />
            <button 
                class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                on:click={closeOverlay}
            >
                ✕
            </button>
        </div>
    </div>
{/if}
