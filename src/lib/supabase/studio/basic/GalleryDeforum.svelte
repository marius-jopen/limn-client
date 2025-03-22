<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    import GalleryDeforumItem from '$lib/supabase/studio/basic/GalleryDeforumItem.svelte';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    
    // Configuration for pagination
    const INITIAL_BATCH_COUNT = 3; // Number of batches to load initially
    const LOAD_MORE_BATCH_COUNT = 2; // Number of batches to load on each "Load More" click
    
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
    export let batchDisplayMode: 'all' | 'latest-only' | 'exclude-latest' = 'all'; // New prop for batch display control
    
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
    let visibleBatchCount = INITIAL_BATCH_COUNT; // Number of batches currently visible
    let hasMoreToLoad = true; // Whether there are more resources to load
    
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
    
    // For batch grouping
    $: groupedResources = groupResourcesByBatch(allResources);
    $: filteredGroups = (() => {
        if (batchDisplayMode === 'latest-only' && groupedResources.length > 0) {
            return [groupedResources[0]]; // Return only the first batch (most recent)
        } else if (batchDisplayMode === 'exclude-latest' && groupedResources.length > 1) {
            return groupedResources.slice(1); // Skip the first batch (most recent)
        } else {
            return groupedResources; // Show all batches
        }
    })();
    $: visibleGroups = filteredGroups.slice(0, visibleBatchCount);
    $: hasMoreBatches = (() => {
        if (batchDisplayMode === 'latest-only') {
            return false; // Never show "Load More" in latest-only mode
        } else {
            return visibleBatchCount < filteredGroups.length || hasMoreToLoad;
        }
    })();
    
    // Add a timer that periodically checks for batch name updates
    let batchUpdateInterval: number;
    
    onMount(() => {
        console.log('GalleryDeforum component mounted with props:', {
            workflow_name,
            workflow_names,
            type,
            typeArray,
            defaultImagesPerRow,
            workflowsToFetch // The derived value
        });
        
        if (!workflow_name && (!workflow_names || workflow_names.length === 0)) {
            console.warn('No workflow_name or workflow_names provided - component may show all resources');
        }
        
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
            
            // Fetch current resources from database with proper filtering
            const fetchedResources = await fetchResourcesFromSupabase({});
            console.log(`Fetched ${fetchedResources.length} resources for batch assignment updates`);
            
            // Create a map of image_url to batch_name from database resources
            const batchMap = new Map();
            fetchedResources.forEach(resource => {
                if (resource.batch_name && workflowsToFetch.includes(resource.workflow_name)) {
                    batchMap.set(resource.image_url, {
                        batch_name: resource.batch_name,
                        workflow_name: resource.workflow_name
                    });
                }
            });
            
            // Aggressively filter allResources to only include resources with matching workflow_name
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const beforeCount = allResources.length;
                allResources = allResources.filter(r => {
                    const isMatch = workflowsToFetch.includes(r.workflow_name);
                    if (!isMatch) {
                        console.error(`Removing resource with workflow_name "${r.workflow_name}" from client cache`);
                    }
                    return isMatch;
                });
                if (beforeCount !== allResources.length) {
                    console.log(`Removed ${beforeCount - allResources.length} resources with non-matching workflow names`);
                }
            }
            
            // Update any client-side resources with batch names from the database
            let hasUpdates = false;
            allResources = allResources.map(resource => {
                if (!resource.batch_name && batchMap.has(resource.image_url)) {
                    const info = batchMap.get(resource.image_url);
                    if (workflowsToFetch.includes(info.workflow_name)) {
                        hasUpdates = true;
                        console.log(`Updating batch name for ${resource.image_url} to ${info.batch_name}`);
                        return { ...resource, batch_name: info.batch_name };
                    }
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
        allResources = allResources.slice(0, visibleBatchCount * 40);
        console.log(`Displaying ${allResources.length} resources`);
    }

    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Function to load more batches
    function loadMore() {
        console.log(`Loading more batches. Current count: ${visibleBatchCount}, total: ${groupedResources.length}`);
        visibleBatchCount += LOAD_MORE_BATCH_COUNT;
        
        // If we've displayed all the currently fetched batches and there might be more, fetch more
        if (visibleBatchCount >= groupedResources.length && hasMoreToLoad) {
            fetchMoreImages();
        }
    }

    // Watch for changes to workflow_name or workflow_names props
    $: {
        if (workflow_name !== undefined || (workflow_names && workflow_names.length > 0) || typeArray.length > 0) {
            console.log('Props changed, resetting and fetching');
            if (initialLoadComplete) {
                allResources = []; // Clear existing resources
                visibleBatchCount = INITIAL_BATCH_COUNT;
                hasMoreToLoad = true;
                fetchUserImages();
            }
        }
    }

    // Helper function to fetch resources from Supabase
    async function fetchResourcesFromSupabase(options) {
        const { 
            offset = 0,
            limit = 100
        } = options;
        
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return [];
            }
            
            console.log('DEBUG - Intended filters:', { 
                user_id,
                workflowsToFetch, 
                typeArray
            });
            
            // Start with a basic query
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .or('visibility.is.null,visibility.eq.true');
            
            // Strengthen workflow filter - ensure we're using .in() with array values
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                console.log('Adding workflow filter:', workflowsToFetch);
                // Make sure workflowsToFetch is an array with valid strings
                const validWorkflows = workflowsToFetch.filter(w => typeof w === 'string' && w.trim() !== '');
                if (validWorkflows.length > 0) {
                    query = query.in('workflow_name', validWorkflows);
                } else {
                    console.warn('No valid workflow names provided after filtering');
                }
            } else {
                console.warn('No workflow names provided for filtering');
            }
            
            // Add type filter as a separate step
            if (typeArray && typeArray.length > 0) {
                console.log('Adding type filter:', typeArray);
                query = query.in('type', typeArray);
            }
            
            // Add ordering and pagination
            query = query.order('created_at', { ascending: false });
            
            if (offset > 0) {
                query = query.range(offset, offset + limit - 1);
            } else {
                query = query.limit(limit);
            }
            
            // Log the full Supabase query to debug
            console.log('Final Supabase query:', query);
            
            const { data, error } = await query;
            
            if (error) {
                console.error(`Error fetching resources:`, error);
                return [];
            }
            
            // Debug log of returned data
            console.log(`Fetched ${data?.length || 0} resources`);
            console.log('Workflow names in fetched data:', 
                [...new Set(data?.map(r => r.workflow_name))]);
            
            // Double-check post-query filter to ensure only matching workflows
            let filteredData = data || [];
            
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(r => {
                    const match = workflowsToFetch.includes(r.workflow_name);
                    if (!match) {
                        console.error(`Removing resource with ID ${r.id}, workflow "${r.workflow_name}" which doesn't match filter ${workflowsToFetch.join(', ')}`);
                    }
                    return match;
                });
                console.log(`Workflow filter: ${beforeCount} → ${filteredData.length} resources`);
            }
            
            if (typeArray && typeArray.length > 0) {
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(r => typeArray.includes(r.type));
                console.log(`Type filter: ${beforeCount} → ${filteredData.length} resources`);
            }
            
            // Final check of workflow names
            console.log('Workflow names after filtering:', 
                [...new Set(filteredData.map(r => r.workflow_name))]);
            
            // Transform URLs
            const transformedData = transformResourceUrls(filteredData);
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
                hasMoreToLoad = false;
            }
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching more images:', e);
        }
    }

    // Handle runState images immediately
    $: if ($runState.images?.length) {
        console.log('Processing runState images with batch:', $runState.batch_name);
        
        // Use a valid workflow name from our allowed workflow names
        const effectiveWorkflowName = workflow_name || 
            (workflowsToFetch.length > 0 ? workflowsToFetch[0] : null);
        
        // Only process the images if they belong to our allowed workflows
        if (effectiveWorkflowName) {
            // First show the images immediately for better UX
            const newImages = $runState.images.map(img => ({
                id: crypto.randomUUID(), 
                image_url: getImageUrl(img),
                user_id: user_id,
                workflow_name: effectiveWorkflowName, // Use the determined workflow name
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
        } else {
            console.log('Skipping runState images due to workflow name mismatch');
        }
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
                        console.log('New resource inserted:', payload.new?.batch_name, 'workflow:', payload.new?.workflow_name);
                        
                        // Only refresh if the new resource has a matching workflow_name
                        if (payload.new && 
                            payload.new.workflow_name && 
                            workflowsToFetch.includes(payload.new.workflow_name)) {
                            console.log('Refreshing due to matching workflow_name');
                            fetchUserImages();
                        } else {
                            console.log('Ignoring new resource with non-matching workflow_name');
                        }
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
                        console.log('Resource updated:', payload.new?.batch_name, 'workflow:', payload.new?.workflow_name);
                        
                        // Only refresh if the updated resource has a matching workflow_name
                        if (payload.new && 
                            payload.new.workflow_name && 
                            workflowsToFetch.includes(payload.new.workflow_name)) {
                            console.log('Refreshing due to matching workflow_name');
                            fetchUserImages();
                        } else {
                            console.log('Ignoring updated resource with non-matching workflow_name');
                        }
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

    // Handle batch deletion
    function handleBatchDeleted(event) {
        const { batchName } = event.detail;
        console.log(`Batch deleted: ${batchName}`);
        
        // Remove all resources belonging to this batch
        allResources = allResources.filter(r => r.batch_name !== batchName);
        
        // Refresh the UI
        fetchUserImages();
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
                .range(page * INITIAL_BATCH_COUNT * 40, (page + 1) * INITIAL_BATCH_COUNT * 40 - 1);
            
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
            hasMore = (data?.length || 0) === INITIAL_BATCH_COUNT * 40;
            
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
            
            console.log('Fetching user images with filters:', { 
                workflows: workflowsToFetch, 
                types: typeArray 
            });
            
            // Single query to fetch all resources for the user
            const fetchedResources = await fetchResourcesFromSupabase({});
            
            console.log(`Fetched ${fetchedResources.length} resources`);
            allResources = fetchedResources;
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

    // Extra validation reactive statement for allResources
    $: {
        // Ensure resources always match our workflow filter
        if (allResources.length > 0 && workflowsToFetch && workflowsToFetch.length > 0) {
            const nonMatchingWorkflows = allResources
                .filter(r => !workflowsToFetch.includes(r.workflow_name))
                .map(r => r.workflow_name);
            
            if (nonMatchingWorkflows.length > 0) {
                console.warn(`Found ${nonMatchingWorkflows.length} resources with non-matching workflows:`, 
                    [...new Set(nonMatchingWorkflows)]);
                
                // Filter them out
                allResources = allResources.filter(r => workflowsToFetch.includes(r.workflow_name));
                console.log(`After filtering, ${allResources.length} resources remain`);
            }
        }
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    {#if visibleGroups.length > 0}
        {#each visibleGroups as group}
            <div class="mb-8">
                <h3 class="text-lg font-medium mb-2 text-gray-800">{group.batchName}</h3>
                <div class="grid gap-1 {gridClass}">
                    {#each group.resources.filter(r => workflowsToFetch.includes(r.workflow_name)) as resource (resource.id)}
                        <GalleryDeforumItem 
                            {resource} 
                            on:imageDeleted={handleImageDeleted}
                            on:batchDeleted={handleBatchDeleted}
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
    
    <!-- Show Load More button if there are more batches to display -->
    {#if hasMoreBatches}
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
