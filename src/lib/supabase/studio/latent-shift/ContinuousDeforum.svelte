<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    import ContinuousDeforumItem from '$lib/supabase/studio/latent-shift/ContinuousDeforumItem.svelte';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    import Button from '$lib/atoms/Button.svelte';
    import ContinuousDeforumVideo from './ContinuousDeforumVideo.svelte';
    
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
        batches_connected?: Array<{batch_name: string, id: string}>;
        service?: string;
    }

    interface RunStateImage {
        url?: string;
        image_url?: string;
    }

    // Interface for lineage path
    interface LineagePath {
        id: string; // Unique ID for this path
        resources: Resource[]; // All resources in this lineage path, in order
        batchName: string; // The batch name for this path
        lastModified: number; // Timestamp of the last modification
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
    let visiblePathCount = INITIAL_BATCH_COUNT; // Number of lineage paths currently visible
    let hasMoreToLoad = true; // Whether there are more resources to load
    
    // Variables for lineage paths
    let lineagePaths: LineagePath[] = [];
    
    // Function to build continuous lineage paths
    function buildLineagePaths(resources: Resource[]) {
        try {
            // Pre-filter resources to ensure only the correct workflow is included
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const beforeCount = resources.length;
                resources = resources.filter(r => workflowsToFetch.includes(r.workflow_name));
                if (beforeCount !== resources.length) {
                    console.log(`Filtered ${beforeCount - resources.length} resources with non-matching workflow names before building lineage paths`);
                }
            }
            
            console.log('Building lineage paths from', resources.length, 'resources');
            
            if (resources.length === 0) return [];
            
            // Group resources by batch_name for easier access
            const resourcesByBatch = new Map<string, Resource[]>();
            const resourcesById = new Map<string, Resource>();
            
            // Populate the maps
            resources.forEach(resource => {
                resourcesById.set(resource.id, resource);
                
                if (resource.batch_name) {
                    if (!resourcesByBatch.has(resource.batch_name)) {
                        resourcesByBatch.set(resource.batch_name, []);
                    }
                    resourcesByBatch.get(resource.batch_name)?.push(resource);
                }
            });
            
            // Sort resources within each batch by creation time
            resourcesByBatch.forEach((resources, batchName) => {
                resources.sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            });
            
            // Get batch creation timestamps (using the first resource in each batch)
            const batchTimestamps = new Map<string, number>();
            resourcesByBatch.forEach((resources, batchName) => {
                if (resources.length > 0) {
                    batchTimestamps.set(batchName, new Date(resources[0].created_at).getTime());
                }
            });
            
            // Sort batch names by creation time, newest first
            const sortedBatchNames = Array.from(resourcesByBatch.keys()).sort((a, b) => {
                const timeA = batchTimestamps.get(a) || 0;
                const timeB = batchTimestamps.get(b) || 0;
                return timeB - timeA; // Newest first
            });
            
            console.log('Sorted batch names (newest first):', sortedBatchNames);
            
            // Create paths array
            const paths: LineagePath[] = [];
            
            // Process each batch to create a lineage path, starting with newest
            for (const batchName of sortedBatchNames) {
                const batchResources = resourcesByBatch.get(batchName) || [];
                if (batchResources.length === 0) continue;
                
                // Get the first resource to determine ancestry
                const firstResource = batchResources[0];
                const lineageResources: Resource[] = [];
                
                // If this batch has ancestors, include them in the lineage
                if (firstResource.batches_connected && 
                    Array.isArray(firstResource.batches_connected) && 
                    firstResource.batches_connected.length > 0) {
                    
                    // Extract the specific source image ID that was used for this batch
                    let sourceImageId: string | null = null;
                    
                    // The source image ID is typically the ID from the last entry in batches_connected
                    if (firstResource.batches_connected.length > 0) {
                        const sourceEntry = firstResource.batches_connected[firstResource.batches_connected.length - 1];
                        sourceImageId = sourceEntry.id;
                    }
                    
                    // Gather all ancestor batches in order
                    const ancestorBatches: Array<{batch_name: string, id: string}> = [...firstResource.batches_connected];
                    
                    // Add resources from each ancestor batch up to the source image
                    for (let i = 0; i < ancestorBatches.length; i++) {
                        const ancestorBatch = ancestorBatches[i];
                        const ancestorResources = resourcesByBatch.get(ancestorBatch.batch_name) || [];
                        
                        // If this is the source batch, only include resources up to the source image
                        if (i === ancestorBatches.length - 1 && sourceImageId) {
                            // Find position of source image in the ancestor batch
                            const sourceIndex = ancestorResources.findIndex(r => r.id === sourceImageId);
                            
                            if (sourceIndex >= 0) {
                                // Add all resources up to and including the source image
                                lineageResources.push(...ancestorResources.slice(0, sourceIndex + 1));
                            } else {
                                // Source image not found, add all resources
                                lineageResources.push(...ancestorResources);
                            }
                        } else {
                            // For other ancestor batches, add all resources
                            lineageResources.push(...ancestorResources);
                        }
                    }
                }
                
                // Add resources from the current batch
                lineageResources.push(...batchResources);
                
                // Sort all resources by creation time
                lineageResources.sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                // Get the last modification timestamp for this path
                const lastModified = lineageResources.length > 0 
                    ? new Date(lineageResources[lineageResources.length - 1].created_at).getTime()
                    : 0;
                
                // Create a new path with these resources
                paths.push({
                    id: `path-${paths.length}`,
                    resources: lineageResources,
                    batchName: batchName,
                    lastModified: lastModified
                });
                
                console.log(`Created lineage path for ${batchName} with ${lineageResources.length} resources`);
            }
            
            // Sort paths with newest first
            return paths.sort((a, b) => b.lastModified - a.lastModified);
        } catch (e) {
            console.error('Error building lineage paths:', e);
            return []; // Return empty array on error
        }
    }
    
    // Update lineage paths whenever allResources changes
    $: {
        if (allResources.length > 0) {
            console.log('Building lineage paths from', allResources.length, 'resources');
            lineagePaths = buildLineagePaths(allResources);
            console.log('Created', lineagePaths.length, 'lineage paths');
        } else {
            lineagePaths = [];
        }
    }
    
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
    
    // For batch grouping (kept for potential future use)
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
    
    // Get visible lineage paths - show multiple paths but keep them separate
    $: visiblePaths = lineagePaths.slice(0, visiblePathCount);

    // Check if there are more paths to load
    $: hasMorePaths = visiblePathCount < lineagePaths.length || hasMoreToLoad;
    
    // Add a timer that periodically checks for batch name updates
    let batchUpdateInterval: number;
    
    // Infinite scroll setup
    let loadingMore = false;
    let scrollObserver: IntersectionObserver;
    let observerTarget: HTMLDivElement;

    // Add these functions for infinite scrolling
    // Set up the intersection observer for infinite scrolling
    function setupInfiniteScroll() {
        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            scrollObserver = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;
                    if (entry.isIntersecting && hasMorePaths && !loadingMore) {
                        loadMore();
                    }
                },
                { rootMargin: '200px' } // Start loading when within 200px of the observer
            );
            
            if (observerTarget) {
                scrollObserver.observe(observerTarget);
            }
        }
    }

    // Clean up observer when component is destroyed
    function cleanupInfiniteScroll() {
        if (scrollObserver) {
            scrollObserver.disconnect();
        }
    }

    // Update onMount to setup infinite scrolling
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
        
        // Set up infinite scrolling
        setupInfiniteScroll();
    });

    // Update onDestroy to clean up infinite scrolling
    onDestroy(() => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
        
        // Clear the interval when component is destroyed
        if (batchUpdateInterval) {
            clearInterval(batchUpdateInterval);
        }
        
        // Clean up infinite scrolling
        cleanupInfiniteScroll();
    });

    // Modify the loadMore function to handle the loading state
    async function loadMore() {
        if (loadingMore || !hasMorePaths) return;
        
        loadingMore = true;
        console.log(`Loading more paths. Current count: ${visiblePathCount}, total: ${lineagePaths.length}`);
        visiblePathCount += LOAD_MORE_BATCH_COUNT;
        userClickedLoadMore = true; // User has explicitly requested more paths
        
        // If we've displayed all the currently fetched paths and there might be more, fetch more
        if (visiblePathCount >= lineagePaths.length && hasMoreToLoad) {
            await fetchMoreImages();
        }
        
        loadingMore = false;
    }
    
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
                if (resource.batch_name && workflowsToFetch.includes(resource.workflow_name)) {
                    batchMap.set(resource.image_url, {
                        batch_name: resource.batch_name,
                        workflow_name: resource.workflow_name
                    });
                }
            });
            
            // Filter out resources with incorrect workflow_name
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const beforeCount = allResources.length;
                allResources = allResources.filter(r => workflowsToFetch.includes(r.workflow_name));
                if (beforeCount !== allResources.length) {
                    console.log(`Removed ${beforeCount - allResources.length} resources with non-matching workflow names`);
                }
            }
            
            // Update any client-side resources with batch names from the database
            let hasUpdates = false;
            allResources = allResources.map(resource => {
                if (!resource.batch_name && batchMap.has(resource.image_url)) {
                    const info = batchMap.get(resource.image_url);
                    hasUpdates = true;
                    console.log(`Updating batch name for ${resource.image_url} to ${info.batch_name}`);
                    return { ...resource, batch_name: info.batch_name, workflow_name: info.workflow_name };
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

    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Add a new state variable to track if user has clicked "Load More"
    let userClickedLoadMore = false;

    // Watch for changes to workflow_name or workflow_names props
    $: {
        if (workflow_name !== undefined || (workflow_names && workflow_names.length > 0) || typeArray.length > 0) {
            console.log('Props changed, resetting and fetching');
            if (initialLoadComplete) {
                allResources = []; // Clear existing resources
                visiblePathCount = INITIAL_BATCH_COUNT;
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
            
            console.log('Fetching with filters:', { workflowsToFetch, typeArray });
            
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false });
            
            // Strengthen workflow filter - ensure we're using valid workflow names
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const validWorkflows = workflowsToFetch.filter(w => typeof w === 'string' && w.trim() !== '');
                if (validWorkflows.length > 0) {
                    query = query.in('workflow_name', validWorkflows);
                    console.log('Filtering by workflows:', validWorkflows);
                } else {
                    console.warn('No valid workflow names found in workflowsToFetch');
                }
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
            
            // Add post-query validation to ensure only the correct workflows are included
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                const beforeCount = data?.length || 0;
                const filteredData = (data || []).filter(r => {
                    const match = workflowsToFetch.includes(r.workflow_name);
                    if (!match) {
                        console.error(`Removing resource with ID ${r.id}, workflow "${r.workflow_name}" which doesn't match filter ${workflowsToFetch.join(', ')}`);
                    }
                    return match;
                });
                
                if (beforeCount !== filteredData.length) {
                    console.log(`Post-query workflow filter: ${beforeCount} → ${filteredData.length} resources`);
                }
                
                // Log the workflow names that were actually found
                console.log('Workflow names after filtering:', 
                    [...new Set(filteredData.map(r => r.workflow_name))]);
                
                // Transform S3 URLs to Bunny.net URLs
                const transformedData = transformResourceUrls(filteredData);
                return transformedData;
            }
            
            // If no workflow filter, just transform and return
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
            
            // Instead of just adding more resources, we'll refresh everything
            // but make sure to show more paths
            visiblePathCount += LOAD_MORE_BATCH_COUNT;
            
            // Do a complete refresh to ensure consistent lineages
            fetchUserImages(true);
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching more images:', e);
        }
    }

    // Simplified fetch function - reset userClickedLoadMore on fresh loads
    async function fetchUserImages(keepVisibleCount = false) {
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return;
            }
            
            console.log('Fetching user images with filters:', { 
                workflows: workflowsToFetch, 
                types: typeArray 
            });
            
            // Save the current visible count if needed
            const currentVisibleCount = keepVisibleCount ? visiblePathCount : INITIAL_BATCH_COUNT;
            const preserveUserChoice = keepVisibleCount && userClickedLoadMore;
            
            // Single query to fetch all resources for the user
            const fetchedResources = await fetchResourcesFromSupabase({ 
                limit: Math.max(200, currentVisibleCount * 50) // Ensure we fetch enough data
            });
            
            console.log(`Fetched ${fetchedResources.length} resources`);
            allResources = fetchedResources;
            
            // Restore the visible count if needed
            if (keepVisibleCount) {
                visiblePathCount = currentVisibleCount;
            } else {
                // Reset when doing a fresh load, unless it's a refresh after load more
                userClickedLoadMore = preserveUserChoice;
            }
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
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

    let showVideoPreview = false;
    let selectedPathResources: Resource[] = [];

    function handleShowVideo(event) {
        const { resource } = event.detail;
        // Find the path containing this resource
        const path = visiblePaths.find(p => 
            p.resources.some(r => r.id === resource.id)
        );
        if (path) {
            // Get only the filtered resources that appear in the row
            const rowResources = path.resources
                .filter(r => workflowsToFetch.includes(r.workflow_name))
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
            selectedPathResources = rowResources;
            showVideoPreview = true;
        }
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <!-- Display continuous lineage paths with horizontal scrolling -->
    {#each visiblePaths as path (path.id)}
        {@const rowResources = path.resources.filter(r => workflowsToFetch.includes(r.workflow_name))}
        <div class="mb-10">
            <div class="px-12 flex overflow-x-auto pb-4 space-x-6 hide-scrollbar">
                {#each rowResources as resource (resource.id)}
                    <div class="flex-shrink-0">
                        <ContinuousDeforumItem 
                            {resource} 
                            on:imageDeleted={handleImageDeleted}
                            on:batchDeleted={handleBatchDeleted}
                            on:showVideo={() => {
                                selectedPathResources = rowResources;
                                showVideoPreview = true;
                            }}
                        />
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    <!-- Only show the button if there are more paths to load and we haven't reached the end -->
    {#if hasMorePaths && (visiblePathCount < lineagePaths.length || hasMoreToLoad)}
        <div class="py-6 flex justify-center">
            {#if loadingMore}
                <div class="flex items-center justify-center space-x-2">
                    <div class="w-4 h-4 rounded-full bg-neutral-100 animate-pulse"></div>
                    <div class="w-4 h-4 rounded-full bg-neutral-100 animate-pulse" style="animation-delay: 0.2s"></div>
                    <div class="w-4 h-4 rounded-full bg-neutral-100 animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
            {:else}
                <Button 
                    label="Load More"
                    variant="secondary"
                    size="sm"
                    onClick={loadMore}
                    classes="mt-12 mb-20"
                />
            {/if}
        </div>
    {/if}
{/if}

{#if showVideoPreview}
    <ContinuousDeforumVideo 
        resources={selectedPathResources}
        on:close={() => showVideoPreview = false}
    />
{/if}

<style>
    /* Hide scrollbar but keep functionality */
    .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;  /* Chrome, Safari and Opera */
    }
    
    /* Style for the invisible target - makes it take up space but be invisible */
    .invisible-target {
        height: 50px; /* Give it some height to trigger the observer */
        opacity: 0;   /* Make it invisible */
    }
    
    /* Make sure loading indicators are visible */
    .visible {
        opacity: 1 !important;
    }
</style>
