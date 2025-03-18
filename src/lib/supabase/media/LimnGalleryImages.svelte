<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    import GalleryImageItem from './LimnGalleryImageItem.svelte';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    
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
        type?: 'uploaded' | 'generated' | string;
        batch_name?: string;
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
    
    // Grid layout state - using static classes based on defaultImagesPerRow
    $: gridClass = getGridClass(defaultImagesPerRow);
    
    // Function to determine the appropriate grid class based on the defaultImagesPerRow
    function getGridClass(columns) {
        // Default responsive grid classes
        const baseClasses = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
        
        // Add the large screen grid class based on columns
        switch(columns) {
            case 4:
                return `${baseClasses} lg:grid-cols-4`;
            case 5:
                return `${baseClasses} lg:grid-cols-5`;
            case 6:
                return `${baseClasses} lg:grid-cols-6`;
            case 7:
                return `${baseClasses} lg:grid-cols-7`;
            case 8:
                return `${baseClasses} lg:grid-cols-8`;
            case 9:
                return `${baseClasses} lg:grid-cols-9`;
            case 10:
                return `${baseClasses} lg:grid-cols-10`;
            case 11:
                return `${baseClasses} lg:grid-cols-11`;
            case 12:
                return `${baseClasses} lg:grid-cols-12`;
            default:
                return `${baseClasses} lg:grid-cols-4`; // Default to 4 columns if unrecognized value
        }
    }
    
    // Pagination state
    let allResources: Resource[] = []; // All fetched resources
    let displayedResources: Resource[] = []; // Resources currently displayed
    let displayCount = IMAGES_PER_PAGE; // Number of resources to display
    let hasMoreToLoad = true; // Whether there are more resources to load - always default to true
    
    // For batch grouping
    $: groupedResources = groupResourcesByBatch(displayedResources);
    
    // Function to group resources by batch_name
    function groupResourcesByBatch(resources: Resource[]) {
        const groups: {[key: string]: Resource[]} = {};
        
        // Group resources by batch_name
        resources.forEach(resource => {
            // Skip resources without batch_name (no more "Ungrouped" category)
            const batchName = resource.batch_name;
            if (!batchName) return;
            
            if (!groups[batchName]) {
                groups[batchName] = [];
            }
            groups[batchName].push(resource);
        });
        
        // Convert to array of group objects for easier rendering
        return Object.entries(groups).map(([batchName, resources]) => ({
            batchName,
            resources,
            // Sort batches with most recent first based on the newest image in each batch
            timestamp: Math.max(...resources.map(r => new Date(r.created_at).getTime()))
        })).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp (newest first)
    }
    
    // Add a timer that periodically checks for batch name updates
    let batchUpdateInterval: number;
    
    onMount(() => {
        console.log('GalleryImages component mounted with props:', {
            workflow_name,
            workflow_names,
            type,
            typeArray,
            defaultImagesPerRow
        });
        
        // Set up an interval to refresh batch assignments
        batchUpdateInterval = setInterval(updateBatchAssignments, 5000); // Check every 5 seconds
    });
    
    onDestroy(() => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
        
        // Clear the interval when component is destroyed
        if (batchUpdateInterval) {
            clearInterval(batchUpdateInterval);
        }
    });
    
    // Function to fetch batch name updates without replacing all resources
    async function updateBatchAssignments() {
        if (!user_id) return;
        
        try {
            console.log('Checking for batch name updates...');
            
            // Fetch current resources from database
            const fetchedResources = await fetchResourcesFromSupabase({});
            
            // Create a map of image_url to batch_name from database resources
            const batchMap = new Map();
            fetchedResources.forEach(resource => {
                if (resource.batch_name) {
                    batchMap.set(resource.image_url, resource.batch_name);
                }
            });
            
            // Update any client-side resources with batch names from the database
            let hasUpdates = false;
            allResources = allResources.map(resource => {
                if (!resource.batch_name && batchMap.has(resource.image_url)) {
                    hasUpdates = true;
                    console.log(`Updating batch name for ${resource.image_url} to ${batchMap.get(resource.image_url)}`);
                    return { ...resource, batch_name: batchMap.get(resource.image_url) };
                }
                return resource;
            });
            
            if (hasUpdates) {
                console.log('Updated batch assignments for existing resources');
            }
        } catch (e) {
            console.error('Error updating batch assignments:', e);
        }
    }
    
    // Combine both props into a single array for internal use
    $: workflowsToFetch = workflow_name 
        ? [workflow_name] 
        : workflow_names;
        
    $: console.log('workflowsToFetch updated:', workflowsToFetch);
    
    let error: string | null = null;
    let subscription: any; // Type will depend on your Supabase client type

    $: user_id = $user?.id;

    // Update displayed resources
    $: {
        displayedResources = allResources.slice(0, displayCount);
        console.log(`Displaying ${displayedResources.length} resources`);
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
            
            // Filter by workflow names if provided
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                query = query.in('workflow_name', workflowsToFetch);
                console.log('Filtering by workflows:', workflowsToFetch);
            }
            
            // Filter by type if provided
            if (typeArray && typeArray.length > 0) {
                query = query.in('type', typeArray);
                console.log('Filtering by types:', typeArray);
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
            
            // Transform S3 URLs to Bunny.net URLs
            const transformedData = transformResourceUrls(data || []);
            
            return transformedData;
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
                }
            } else {
                console.log('No additional resources found');
            }
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching more images:', e);
        }
    }

    // Handle runState images immediately
    $: if ($runState.images?.length) {
        console.log('Processing runState images with batch:', $runState.batch_name);
        
        // First show the images immediately for better UX
        const newImages = $runState.images.map(img => ({
            id: crypto.randomUUID(), 
            image_url: getImageUrl(img),
            user_id: user_id,
            workflow_name: workflow_name,
            created_at: new Date().toISOString(),
            batch_name: $runState.batch_name || undefined
        }));
        
        // Merge new images with existing ones, avoiding duplicates
        const existingUrls = new Set(allResources.map(r => r.image_url));
        const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.image_url));
        allResources = [...uniqueNewImages, ...allResources];
        
        // Then set up a short delay to fetch from database instead
        // This gives Supabase time to create the records with proper batch names
        setTimeout(() => {
            console.log('Refreshing images from database after generation');
            fetchUserImages();
        }, 2000); // 2 second delay
    }

    // Simplified subscription setup
    function setupSubscription() {
        // Clean up existing subscription
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }

        if (user_id) {
            console.log('Setting up subscription for resource changes');
            
            subscription = supabase
                .channel(`resource_changes_${user_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id}`
                    },
                    (payload) => {
                        console.log('New resource inserted:', payload.new?.batch_name);
                        // Refresh all resources on new inserts
                        fetchUserImages();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id}`
                    },
                    (payload) => {
                        console.log('Resource updated:', payload.new?.batch_name);
                        // Refresh all resources on updates
                        fetchUserImages();
                    }
                )
                .subscribe();
        }
    }

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
    });

    // Initial setup
    let initialLoadComplete = false;
    $: {
        if (user_id && !initialLoadComplete) {
            console.log('Initial component setup');
            setupSubscription();
            allResources = []; // Clear existing resources
            fetchUserImages();
            initialLoadComplete = true;
        }
    }

    // Handle image deletion
    function handleImageDeleted(event) {
        const { id } = event.detail;
        console.log(`Image deleted: ${id}`);
        allResources = allResources.filter(r => r.id !== id);
    }

    // State variables
    let resources: Resource[] = [];
    let isLoading = false;
    let hasMore = true;
    let page = 0;
    let selectedWorkflow = workflow_name;
    let selectedType: string | null = null;
    
    // Get user ID from store
    $: userId = $user?.id;
    
    // Watch for changes to workflow_name prop
    $: if (workflow_name !== selectedWorkflow) {
        selectedWorkflow = workflow_name;
        resetAndFetch();
    }
    
    // Function to reset state and fetch images
    function resetAndFetch() {
        resources = [];
        page = 0;
        hasMore = true;
        fetchImages();
    }
    
    // Function to fetch images from Supabase
    async function fetchImages() {
        if (!userId || isLoading || !hasMore) return;
        
        isLoading = true;
        error = null;
        
        try {
            console.log(`Fetching images for user ${userId}, page ${page}, workflow ${selectedWorkflow}`);
            
            // Start building the query
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(page * IMAGES_PER_PAGE, (page + 1) * IMAGES_PER_PAGE - 1);
            
            // Add workflow filter if specified
            if (selectedWorkflow) {
                query = query.eq('workflow_name', selectedWorkflow);
            } else if (workflow_names && workflow_names.length > 0) {
                query = query.in('workflow_name', workflow_names);
            }
            
            // Add type filter if specified
            if (typeArray && typeArray.length > 0) {
                query = query.in('type', typeArray);
            }
            
            // Add selected type filter if specified
            if (selectedType) {
                query = query.eq('type', selectedType);
            }
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) {
                throw new Error(fetchError.message || 'Failed to fetch images');
            }
            
            // Transform S3 URLs to Bunny.net URLs
            const transformedData = transformResourceUrls(data || []);
            
            // Update state
            resources = [...resources, ...transformedData];
            page += 1;
            hasMore = (data?.length || 0) === IMAGES_PER_PAGE;
            
            console.log(`Fetched ${data?.length} images, total now: ${resources.length}`);
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        } finally {
            isLoading = false;
        }
    }

    // Simplified fetch function
    async function fetchUserImages() {
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return;
            }
            
            console.log('Fetching user images');
            
            // Single query to fetch all resources for the user
            const fetchedResources = await fetchResourcesFromSupabase({});
            
            console.log(`Fetched ${fetchedResources.length} resources`);
            allResources = fetchedResources;
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    {#if displayedResources.length > 0}
        {#each groupedResources as group}
            <div class="mb-8">
                <h3 class="text-lg font-medium mb-2 text-gray-800">{group.batchName}</h3>
                <div class="grid gap-1 {gridClass}">
                    {#each group.resources as resource (resource.id)}
                        <GalleryImageItem 
                            {resource} 
                            on:imageDeleted={handleImageDeleted}
                        />
                    {/each}
                </div>
            </div>
        {/each}
        
    {:else if allResources.length === 0}
        <div class="min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
            <p class="text-gray-500 text-lg">No images found in your account</p>
        </div>
    {:else}
        <div class="min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
            <p class="text-gray-500 text-lg">No images to display</p>
        </div>
    {/if}
    
    <!-- Always show Load More button if there are images -->
    {#if displayedResources.length > 0}
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
