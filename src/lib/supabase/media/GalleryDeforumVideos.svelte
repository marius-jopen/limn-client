<script lang="ts">
    import { onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import Button from '$lib/atoms/Button.svelte';
    import VideoLooper from '$lib/layout/ui/VideoLooper.svelte';
    
    // Configuration for video playback
    const VIDEO_FPS = 15; // Frames per second for video animations
    
    interface Resource {
        id: string;
        user_id: string;
        workflow_name: string;
        batch_name: string | null;
        name: string | null;
        image_url: string;
        created_at: string; // ISO date string from Supabase
    }

    interface GroupedResources {
        [batchName: string]: Resource[];
    }
    
    // Accept either a single workflow name or an array of workflow names
    export let workflow_names: string[] = [];
    export let workflow_name: string | undefined = undefined;
    
    // Combine both props into a single array for internal use
    $: workflowsToFetch = workflow_name 
        ? [workflow_name] 
        : workflow_names;
    
    let resources: Resource[] = [];
    let error: string | null = null;
    let selectedBatch: string | null = null;
    let selectedImages: Resource[] = [];
    let isLoading = false;

    // Pagination state
    const BATCHES_PER_PAGE = 4;
    let currentPage = 0;
    let hasMoreBatches = true;
    let loadedBatchNames: string[] = [];
    let totalBatchCount = 0; // Track total number of unique batches
    let loadingBatchPage = false; // Separate from isLoading to indicate batch page loading
    let groupedResources: GroupedResources = {};

    $: user_id = $user?.id;

    // Cache for sorted batches to avoid repeated sorting
    let _cachedSortedBatches: [string, Resource[]][] | null = null;
    let lastGroupedResourcesCount = 0; // Track when we need to refresh the cache

    // Near the top of the script section, add a reactive counter:
    let uiForceUpdateCounter = 0;
    let debugBatchCount = 0;

    // Force component update by incrementing this counter
    let forceUpdateKey = 0;

    // Function to get distinct batch names with pagination
    async function fetchBatchNames() {
        if (!user_id || workflowsToFetch.length === 0 || loadingBatchPage) {
            console.log("Early exit from fetchBatchNames:", { 
                user_id: !!user_id, 
                workflowsCount: workflowsToFetch.length, 
                loadingBatchPage
            });
            return;
        }
        
        isLoading = true;
        loadingBatchPage = true;
        
        try {
            console.log(`Fetching batch page ${currentPage + 1} (${BATCHES_PER_PAGE} batches per page)`);
            console.log(`Currently loaded batch names:`, loadedBatchNames);
            
            // Get all batch names in descending order of creation date
            const { data: batchData, error: batchError } = await supabase
                .from('resource')
                .select('batch_name, created_at')
                .eq('user_id', user_id)
                .in('workflow_name', workflowsToFetch)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false })
                .not('batch_name', 'is', 'null');  // Only get resources with batch names

            if (batchError) throw batchError;
            
            // Extract valid batch names (non-null, non-empty strings)
            const allBatchNames = batchData
                .map(item => item.batch_name)
                .filter(name => name !== null && name !== '') as string[];
                
            // Get a list of unique batch names
            const uniqueBatchNamesAll = [...new Set(allBatchNames)];
            
            // Update our total count for display
            totalBatchCount = uniqueBatchNamesAll.length;
            
            console.log(`Found ${uniqueBatchNamesAll.length} total unique batches`);
            
            // Filter out batch names we've already loaded
            const unloadedBatchNames = uniqueBatchNamesAll
                .filter(name => !loadedBatchNames.includes(name));
            
            console.log(`${unloadedBatchNames.length} batches not yet loaded`);
            
            // Get just the next page of batch names
            const nextBatchNames = unloadedBatchNames.slice(0, BATCHES_PER_PAGE);
            
            if (nextBatchNames.length === 0) {
                console.log("No more batches to load");
                hasMoreBatches = false;
                isLoading = false;
                loadingBatchPage = false;
                return;
            }
            
            console.log(`Will fetch these batch names for page ${currentPage + 1}:`, nextBatchNames);
            
            // IMPORTANT: Update the loadedBatchNames BEFORE fetching resources
            // This prevents race conditions where multiple load more clicks could load the same batches
            loadedBatchNames = [...loadedBatchNames, ...nextBatchNames];
            
            // Fetch ALL resources for each batch name
            const { data: resourceData, error: resourceError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .in('workflow_name', workflowsToFetch)
                .in('batch_name', nextBatchNames)
                .or('visibility.is.null,visibility.eq.true') 
                .order('created_at', { ascending: true }); // Frames in sequence

            if (resourceError) throw resourceError;
            
            const newResources = resourceData as Resource[];
            console.log(`Fetched ${newResources.length} resources for ${nextBatchNames.length} batches`);
            
            if (newResources.length === 0) {
                console.log("Fetched batches have no resources, skipping");
                return;
            }
            
            // Group by batch name for debugging
            const newResourcesByBatch = newResources.reduce<Record<string, Resource[]>>((acc, resource) => {
                if (!resource.batch_name) return acc;
                
                const batchName = resource.batch_name;
                if (!acc[batchName]) acc[batchName] = [];
                acc[batchName].push(resource);
                return acc;
            }, {});
            
            // Log batch sizes for debugging
            Object.entries(newResourcesByBatch).forEach(([batchName, batchResources]) => {
                console.log(`Batch "${batchName}" has ${batchResources.length} images`);
            });
            
            // Add new resources to our collection - filter out any null batch names to be safe
            const filteredResources = newResources.filter(r => !!r.batch_name);
            
            if (filteredResources.length > 0) {
                // Create a completely new array to force reactivity
                resources = [...resources, ...filteredResources];
                
                // Log what we've added
                console.log(`Added ${filteredResources.length} new resources to the collection`);
                
                // Update hasMoreBatches flag
                hasMoreBatches = unloadedBatchNames.length > nextBatchNames.length;
                
                // Increment page for next load
                currentPage++;
                
                // Update grouped resources to reflect the new data
                updateGroupedResources();
                
                // Force a reactive update by triggering a state change
                resources = [...resources]; // Create a new array reference
                
                // Force component refresh with a counter increment
                uiForceUpdateCounter += 1;
                
                console.log(`Updated state. Now have ${Object.keys(groupedResources).length} batches with ${resources.length} total images`);
                console.log(`UI update counter: ${uiForceUpdateCounter}`);
            } else {
                console.log("No valid resources found in the fetched data");
            }
            
            // After everything is loaded and processed, force a UI refresh with a slight delay
            setTimeout(() => {
                forceUpdateKey++;
                console.log("FORCED UI REFRESH: Key updated to", forceUpdateKey);
            }, 500);
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching batch names:', e);
        } finally {
            isLoading = false;
            loadingBatchPage = false;
        }
    }

    // Update the groupedResources 
    function updateGroupedResources() {
        console.log(`Updating grouped resources from ${resources.length} total resources`);
        
        // Create a completely new object to ensure reactivity
        const newGroupedResources: GroupedResources = {};
        
        // Rebuild the groups from scratch
        resources.forEach(resource => {
            if (!resource.batch_name) {
                return; // Skip null batch names
            }
            
            const batchName = resource.batch_name;
            
            if (!newGroupedResources[batchName]) {
                newGroupedResources[batchName] = [];
            }
            newGroupedResources[batchName].push(resource);
        });
        
        console.log(`Built new groupedResources with ${Object.keys(newGroupedResources).length} batches`);
        
        // Force reactivity by assigning the new object
        groupedResources = newGroupedResources;
        
        // Always invalidate the cache when updating
        _cachedSortedBatches = null;
        
        // Debug: log all batch names
        console.log(`All batch names after update: ${Object.keys(groupedResources).join(', ')}`);
    }

    // Sort batches by creation date (newest first)
    function getSortedBatches() {
        // Always rebuild on each call to ensure freshness
        const entries = Object.entries(groupedResources);
        debugBatchCount = entries.length; // Update the debug counter
        
        console.log(`getSortedBatches: Processing ${entries.length} batches, UI counter: ${uiForceUpdateCounter}`);
        
        if (entries.length === 0) {
            return [];
        }
        
        const sortedEntries = entries.sort((a, b) => {
            // Using the first resource in each batch to determine the batch's creation date
            const aResources = a[1];
            const bResources = b[1];
            
            if (aResources.length === 0 && bResources.length === 0) return 0;
            if (aResources.length === 0) return 1;
            if (bResources.length === 0) return -1;
            
            // Get the creation date of the first resource in each batch
            const aDate = new Date(aResources[0].created_at).getTime();
            const bDate = new Date(bResources[0].created_at).getTime();
            
            // Sort in descending order (newest first)
            return bDate - aDate;
        });
        
        console.log(`getSortedBatches: Returning ${sortedEntries.length} sorted batches`);
        // Return a fresh array every time
        return sortedEntries;
    }

    let subscription;

    function setupSubscription() {
        // Clean up existing subscription if it exists
        if (subscription) {
            subscription.unsubscribe();
        }

        if (user_id && workflowsToFetch.length > 0) {
            // Create a filter condition for each workflow name
            const filterConditions = workflowsToFetch.map(wf => 
                `user_id=eq.${user_id} AND workflow_name=eq.${wf}`
            );
            
            // Join with OR
            const filterString = filterConditions.join(' OR ');
            
            subscription = supabase
                .channel('resource_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: filterString
                    },
                    () => {
                        // Reset pagination state on data changes and refetch from the beginning
                        resetPagination();
                    }
                )
                .subscribe();
        }
    }

    // Function to reset pagination and fetch from the beginning
    function resetPagination() {
        resources = [];
        loadedBatchNames = [];
        groupedResources = {};
        currentPage = 0;
        hasMoreBatches = true;
        fetchBatchNames();
    }

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        if (subscription) {
            subscription.unsubscribe();
        }
    });

    // Setup subscription and fetch initial batches when user_id or workflowsToFetch changes
    $: {
        if (user_id && workflowsToFetch.length > 0) {
            setupSubscription();
            resetPagination();
        }
    }

    function handleBatchClick(batchName: string, batchResources: Resource[]) {
        selectedBatch = batchName;
        selectedImages = batchResources;
    }

    function closeOverlay() {
        selectedBatch = null;
        selectedImages = [];
    }

    // Function to load more batches
    function loadMore() {
        console.log("Load More clicked. Current page:", currentPage, "Loaded batches:", loadedBatchNames.length);
        
        if (loadingBatchPage) {
            console.log("Already loading, ignoring click");
            return;
        }
        
        if (!hasMoreBatches) {
            console.log("No more batches to load");
            return;
        }
        
        // This extreme approach forces a complete UI refresh
        console.log("FORCING EXTREME REFRESH");
        
        // 1. Store our current data
        const oldResources = [...resources];
        const oldLoadedBatchNames = [...loadedBatchNames];
        
        // 2. Completely clear and rebuild all state
        resources = [];
        groupedResources = {};
        _cachedSortedBatches = null;
        
        // 3. Force UI update with the counter
        uiForceUpdateCounter += 1;
        
        // 4. Add a very slight delay to let Svelte catch up with the emptying
        setTimeout(() => {
            // 5. Restore the data (creates all new object references)
            resources = [...oldResources];
            
            // 6. Force a complete rebuild of grouped resources
            updateGroupedResources();
            
            // 7. Increment the counter again to force another update
            uiForceUpdateCounter += 1;
            
            // 8. Now fetch the new batches
            console.log("Before loading more - Current batches:", Object.keys(groupedResources).join(", "));
            console.log("Current resources count:", resources.length);
            fetchBatchNames();
        }, 10);
    }

    // Function to handle batch deletion
    async function handleDeleteBatch(batchName: string): Promise<void> {
        try {
            const batchResources = groupedResources[batchName];
            if (!batchResources || batchResources.length === 0) {
                throw new Error('No resources found for this batch');
            }

            const url = `http://localhost:4000/api/batch/delete`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ batch: batchName })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete batch');
            }

            // Reset and refetch after deletion
            resetPagination();
            
            // If the deleted batch was being displayed in the overlay, close it
            if (selectedBatch === batchName) {
                closeOverlay();
            }
        } catch (e) {
            error = e.message;
            console.error('Error deleting batch:', e);
            alert('Failed to delete batch: ' + e.message);
        }
    }

    // Add a reactive statement to ensure the UI updates when groupedResources changes
    $: batchCount = Object.keys(groupedResources).length;
    $: console.log(`Reactive update: batchCount=${batchCount}, uiForceUpdateCounter=${uiForceUpdateCounter}, debugBatchCount=${debugBatchCount}`);
    $: visibleBatches = getSortedBatches();
</script>

<!-- Enhanced debug info for development -->
<svelte:head>
    <title>Deforum Gallery - {Object.keys(groupedResources).length} of {totalBatchCount} batches</title>
</svelte:head>

<!-- Debug counter -->
<div class="sr-only">
    Force update key: {forceUpdateKey}
    Batches: {Object.keys(groupedResources).join(', ')}
</div>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else if resources.length === 0}
    <div class="flex justify-center items-center p-8 text-gray-500">
        {#if isLoading}
            <p>Loading batches...</p>
        {:else}
            <p>No batches found. {user_id ? '' : 'You may need to sign in.'}</p>
        {/if}
    </div>
{:else if Object.keys(groupedResources).length === 0}
    <div class="flex justify-center items-center p-8 text-gray-500">
        <p>No batches found with valid batch names.</p>
    </div>
{:else}
    <div class="flex flex-col gap-4 pt-8">
        <!-- <p class="text-sm text-gray-500">
            Loaded {Object.keys(groupedResources).length} of {totalBatchCount} batches ({resources.length} total images) 
            <small>(Update counter: {uiForceUpdateCounter})</small>
        </p> -->
        
        <!-- Use visibleBatches directly to ensure reactivity -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {#key forceUpdateKey}
                {#each getSortedBatches() as [batchName, batchResources], index}
                    <div class="relative group border border-gray-200 overflow-hidden">
                        <div class="aspect-square w-full overflow-hidden cursor-pointer"
                            on:click={() => handleBatchClick(batchName, batchResources)}
                            on:keydown={(e) => e.key === 'Enter' && handleBatchClick(batchName, batchResources)}
                            role="button"
                            tabindex="0"
                        >
                            <div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500 z-0">
                                {batchResources.length} images
                            </div>

                            <VideoLooper 
                                images={batchResources.map(resource => resource.image_url)}
                                fps={VIDEO_FPS}
                                autoPlay={true}
                                showControls={false}
                                aspectRatio="square"
                            />
                        </div>
                        <div class="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-br">
                            <span title={batchName}>{batchName.length > 20 ? batchName.substring(0, 20) + '...' : batchName}</span>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 bg-black bg-opacity-50">
                            <button
                                class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow-md text-sm"
                                on:click|stopPropagation={() => handleDeleteBatch(batchName)}
                            >
                                Delete Batch
                            </button>
                        </div>
                    </div>
                {/each}
            {/key}
        </div>
        
        {#if hasMoreBatches || loadingBatchPage}
            <div class="mt-6 flex justify-center flex-col items-center gap-2">
                <Button 
                    onClick={loadMore}
                    label={loadingBatchPage ? "Loading..." : "Load More Batches"}
                    variant="primary"
                    size="md"
                    disabled={loadingBatchPage}
                />
                {#if loadingBatchPage}
                    <p class="text-sm text-gray-500">Loading page {currentPage + 1} ({loadedBatchNames.length + 1}-{Math.min(loadedBatchNames.length + BATCHES_PER_PAGE, totalBatchCount)} of {totalBatchCount} batches)...</p>
                {/if}
            </div>
        {:else}
            <div class="mt-6 flex justify-center">
                <p class="text-sm text-gray-500">All {totalBatchCount} batches loaded</p>
            </div>
        {/if}
    </div>
{/if}

{#if selectedBatch && selectedImages.length > 0}
    <div 
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        on:click={closeOverlay}
        on:keydown={(e) => e.key === 'Escape' && closeOverlay()}
        role="button"
        tabindex="0"
    >
        <div 
            class="relative max-w-4xl max-h-[90vh] w-full"
            on:click|stopPropagation={() => {}}
        >
            <VideoLooper 
                images={selectedImages.map(resource => resource.image_url)}
                fps={VIDEO_FPS}
                autoPlay={true}
                showControls={true}
                aspectRatio="video"
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