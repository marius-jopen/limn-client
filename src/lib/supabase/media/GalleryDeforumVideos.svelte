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
    let groupedResources: GroupedResources = {};

    $: user_id = $user?.id;

    // Function to get distinct batch names with pagination
    async function fetchBatchNames() {
        if (!user_id || workflowsToFetch.length === 0 || isLoading || !hasMoreBatches) return;
        
        isLoading = true;
        try {
            console.log(`Fetching batch page ${currentPage + 1} (${BATCHES_PER_PAGE} batches per page)`);
            
            // First, get unique batch names with pagination
            const { data: batchData, error: batchError } = await supabase
                .from('resource')
                .select('batch_name')
                .eq('user_id', user_id)
                .in('workflow_name', workflowsToFetch)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false })
                .not('batch_name', 'is', 'null');  // Only get resources with batch names

            if (batchError) throw batchError;
            
            // Extract unique batch names, filtering out nulls and already loaded batches
            const allBatchNames = batchData
                .map(item => item.batch_name)
                .filter(name => name !== null) as string[];
                
            const uniqueBatchNames = [...new Set(allBatchNames)]
                .filter(name => !loadedBatchNames.includes(name));
                
            console.log(`Found ${uniqueBatchNames.length} new unique batches`);
            
            // Get the batch names for this page
            const batchNamesForPage = uniqueBatchNames.slice(0, BATCHES_PER_PAGE);
            
            if (batchNamesForPage.length === 0) {
                console.log("No more batches to load");
                hasMoreBatches = false;
                isLoading = false;
                return;
            }
            
            // Fetch ALL resources for each batch name to ensure animations work
            // We need to get every frame in each batch for the animation to play
            const { data: resourceData, error: resourceError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .in('workflow_name', workflowsToFetch)
                .in('batch_name', batchNamesForPage)
                .or('visibility.is.null,visibility.eq.true') 
                .order('created_at', { ascending: true }); // Order ascending to get frames in correct sequence

            if (resourceError) throw resourceError;
            
            // Add these new resources to our existing collection
            const newResources = resourceData as Resource[];
            console.log(`Fetched ${newResources.length} resources for ${batchNamesForPage.length} batches`);
            
            // Group the resources by batch_name to check if we have enough images for each batch
            const newResourcesByBatch = newResources.reduce<Record<string, Resource[]>>((acc, resource) => {
                const batchName = resource.batch_name || 'Uncategorized';
                if (!acc[batchName]) acc[batchName] = [];
                acc[batchName].push(resource);
                return acc;
            }, {});
            
            // Log the count of images per batch for debugging
            Object.entries(newResourcesByBatch).forEach(([batchName, batchResources]) => {
                console.log(`Batch "${batchName}" has ${batchResources.length} images`);
            });
            
            resources = [...resources, ...newResources];
            
            // Update our list of loaded batch names
            loadedBatchNames = [...loadedBatchNames, ...batchNamesForPage];
            
            // Check if we have more to load
            hasMoreBatches = uniqueBatchNames.length > BATCHES_PER_PAGE;
            
            // Increment page for next load
            currentPage++;
            
            // Update the grouped resources
            updateGroupedResources();
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching batch names:', e);
        } finally {
            isLoading = false;
        }
    }

    // Update the groupedResources 
    function updateGroupedResources() {
        groupedResources = resources.reduce<GroupedResources>((groups, resource) => {
            const batchName = resource.batch_name || 'Uncategorized';
            if (!groups[batchName]) {
                groups[batchName] = [];
            }
            groups[batchName].push(resource);
            return groups;
        }, {});
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
        fetchBatchNames();
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
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class="flex flex-col gap-4 pt-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {#each Object.entries(groupedResources) as [batchName, batchResources]}
                <div class="relative group">
                    <div class="aspect-square w-full overflow-hidden cursor-pointer"
                        on:click={() => handleBatchClick(batchName, batchResources)}
                        on:keydown={(e) => e.key === 'Enter' && handleBatchClick(batchName, batchResources)}
                        role="button"
                        tabindex="0"
                    >
                        <VideoLooper 
                            images={batchResources.map(resource => resource.image_url)}
                            fps={VIDEO_FPS}
                            autoPlay={true}
                            showControls={false}
                            aspectRatio="square"
                        />
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                            class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow-md"
                            on:click|stopPropagation={() => handleDeleteBatch(batchName)}
                        >
                            Delete Batch
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if hasMoreBatches || isLoading}
            <div class="mt-4 flex justify-center">
                <Button 
                    onClick={loadMore}
                    label={isLoading ? "Loading..." : "Load More"}
                    variant="primary"
                    size="md"
                    disabled={isLoading}
                />
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
