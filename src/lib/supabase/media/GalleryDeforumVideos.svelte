<script lang="ts">
    import { onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import Button from '$lib/atoms/Button.svelte';
    
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
    
    export let workflow_name: string;
    
    let resources: Resource[] = [];
    let error: string | null = null;
    let selectedImage: Resource | null = null;

    // Add state for animation intervals and current indices
    let batchIntervals: Map<string, number> = new Map();
    let batchCurrentIndices: Map<string, number> = new Map();

    // Add state for overlay animation
    let overlayInterval: number | null = null;
    let overlayCurrentIndex = 0;
    let overlayImages: Resource[] = [];

    // Add state for pagination
    let displayCount = 4;

    $: user_id = $user?.id;

    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('workflow_name', workflow_name)
                .or('visibility.is.null,visibility.eq.true') 
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            resources = data;
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

    let subscription;

    function setupSubscription() {
        // Clean up existing subscription if it exists
        if (subscription) {
            subscription.unsubscribe();
        }

        if (user_id) {
            subscription = supabase
                .channel('resource_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id} AND workflow_name=eq.${workflow_name}`
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
            subscription.unsubscribe();
        }
        batchIntervals.forEach(interval => clearInterval(interval));
        if (overlayInterval) clearInterval(overlayInterval);
    });

    // Setup subscription and fetch images when user_id or workflow_name changes
    $: {
        if (user_id && workflow_name) {
            setupSubscription();
            fetchUserImages();
        }
    }

    // Modify handleImageClick to animate backwards
    function handleImageClick(resource: Resource) {
        const batchName = Object.entries(groupedResources).find(([_, resources]) => 
            resources.includes(resource)
        )[0];
        overlayImages = groupedResources[batchName];
        overlayCurrentIndex = overlayImages.indexOf(resource);
        
        // Start overlay animation going backwards
        if (overlayInterval) clearInterval(overlayInterval);
        overlayInterval = setInterval(() => {
            overlayCurrentIndex = (overlayCurrentIndex - 1 + overlayImages.length) % overlayImages.length;
        }, 67);
        
        selectedImage = resource;
    }

    // Modify closeOverlay to cleanup overlay animation
    function closeOverlay() {
        if (overlayInterval) {
            clearInterval(overlayInterval);
            overlayInterval = null;
        }
        selectedImage = null;
        overlayImages = [];
        overlayCurrentIndex = 0;
    }

    // Update the groupedResources computed property type
    $: groupedResources = resources.reduce<GroupedResources>((groups, resource) => {
        const batchName = resource.batch_name || 'Uncategorized';
        if (!groups[batchName]) {
            groups[batchName] = [];
        }
        groups[batchName].push(resource);
        return groups;
    }, {});

    // Function to start animation for a batch
    function startBatchAnimation(batchName: string, batchResources: Resource[]) {
        if (batchIntervals.has(batchName)) {
            clearInterval(batchIntervals.get(batchName));
        }

        batchCurrentIndices.set(batchName, 0);
        const interval = setInterval(() => {
            batchCurrentIndices.set(
                batchName,
                (batchCurrentIndices.get(batchName) - 1 + batchResources.length) % batchResources.length
            );
            batchCurrentIndices = batchCurrentIndices; // Trigger reactivity
        }, 67);
        batchIntervals.set(batchName, interval);
    }

    // Start animations when resources change
    $: {
        if (Object.entries(groupedResources).length > 0) {
            Object.entries(groupedResources).forEach(([batchName, batchResources]) => {
                startBatchAnimation(batchName, batchResources);
            });
        }
    }

    // Function to load more batches
    function loadMore() {
        displayCount += 4;
    }
    
    // Calculate if there are more batches to show
    $: hasMore = Object.keys(groupedResources).length > displayCount;

    // Add this function before the script's end
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

            // Clear the animation interval for this batch
            if (batchIntervals.has(batchName)) {
                clearInterval(batchIntervals.get(batchName));
                batchIntervals.delete(batchName);
            }

            // Refetch the data to update the UI
            await fetchUserImages();
            
            // If the deleted batch was being displayed in the overlay, close it
            if (selectedImage && selectedImage.batch_name === batchName) {
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
    <h2>{workflow_name}</h2>
    <div class="flex flex-col">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {#each Object.entries(groupedResources).slice(0, displayCount) as [batchName, batchResources]}
                <div class="relative group">
                    <div class="aspect-square w-full overflow-hidden cursor-pointer"
                        on:click={() => handleImageClick(batchResources[batchCurrentIndices.get(batchName) || 0])}
                        on:keydown={(e) => e.key === 'Enter' && handleImageClick(batchResources[batchCurrentIndices.get(batchName) || 0])}
                        role="button"
                        tabindex="0"
                    >
                        <img 
                            src={batchResources[batchCurrentIndices.get(batchName) || 0].image_url} 
                            alt={batchResources[batchCurrentIndices.get(batchName) || 0].name || 'User uploaded image'} 
                            class="w-full h-full object-cover"
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
        
        {#if hasMore}
            <Button 
                onClick={loadMore}
                label="Load More"
                variant="primary"
                size="md"
            />
        {/if}
    </div>
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
        >
            <img 
                src={overlayImages[overlayCurrentIndex].image_url} 
                alt={overlayImages[overlayCurrentIndex].name || 'User uploaded image'} 
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
