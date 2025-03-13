<script>
    import { onMount, onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    import LimnGeneratorRow from '$lib/runpod/ui/limn/LimnGeneratorRow.svelte';

    // Define interface for our data structure
    /**
     * @typedef {Object} Resource
     * @property {string} id - The unique identifier for the resource
     * @property {string} image_url - URL to the image
     * @property {string} user_id - ID of the user who owns the resource
     * @property {string} workflow_name - Name of the workflow that generated the resource
     * @property {string} created_at - Timestamp when the resource was created
     * @property {boolean} [visibility] - Whether the resource is visible
     * @property {string} [type] - Type of resource (e.g., 'uploaded', 'generated')
     * @property {string} [batch_name] - Name of the batch this resource belongs to
     */

    export let ui_config
    export let workflow

    // Workflow names to filter by
    const workflowsToFetch = ['deforum-limn', 'deforum-limn-init'];
    
    // Object to store batches of images
    let imageBatches = {};
    let batchNames = [];
    let error = null;
    let subscription;

    // Lazy loading configuration for UI
    const INITIAL_BATCHES = 2; // Number of batches to load initially
    const BATCHES_PER_LOAD = 2; // Number of batches to load each time
    let visibleBatchCount = INITIAL_BATCHES;
    let containerElement;
    let loadingMore = false;

    // Lazy loading configuration for database queries
    const IMAGES_PER_PAGE = 50; // Number of images to fetch per page
    let currentPage = 0;
    let hasMoreImages = true;
    let isFetchingImages = false;

    // Get user ID from store
    $: userId = $user?.id;
    
    // Compute visible batch names based on the current count
    $: visibleBatchNames = batchNames.slice(0, visibleBatchCount);

    // Function to fetch a page of images from Supabase
    async function fetchImagePage() {
        if (!userId || isFetchingImages || !hasMoreImages) {
            return;
        }

        isFetchingImages = true;
        
        try {
            console.log(`Fetching images page ${currentPage} for Limn Generator`);
            
            let query = supabase
                .from('resource')
                .select('id, image_url, workflow_name, batch_name')
                .eq('user_id', userId)
                .in('workflow_name', workflowsToFetch)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false })
                .range(currentPage * IMAGES_PER_PAGE, (currentPage + 1) * IMAGES_PER_PAGE - 1);
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) {
                throw new Error(fetchError.message || 'Failed to fetch images');
            }
            
            console.log(`Fetched ${data?.length || 0} images for page ${currentPage}`);
            
            // Process the fetched images
            processImages(data || []);
            
            // Update pagination state
            currentPage++;
            hasMoreImages = data.length === IMAGES_PER_PAGE;
            
            // If we need more batches and there are more images, fetch the next page
            if (visibleBatchCount > batchNames.length && hasMoreImages) {
                // Small delay to prevent rapid consecutive requests
                setTimeout(() => {
                    fetchImagePage();
                }, 300);
            }
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching images for Limn Generator:', e);
        } finally {
            isFetchingImages = false;
        }
    }

    // Process images and group them by batch
    function processImages(images) {
        // Create a copy of the current batches
        let updatedBatches = { ...imageBatches };
        
        // Process new images
        images.forEach(resource => {
            const batchName = resource.batch_name || 'default';
            
            if (!updatedBatches[batchName]) {
                updatedBatches[batchName] = [];
            }
            
            // Check if image already exists in this batch
            const exists = updatedBatches[batchName].some(img => img.id === resource.id);
            if (!exists) {
                updatedBatches[batchName].push({
                    url: transformToBunnyUrl(resource.image_url),
                    word: resource.workflow_name,
                    id: resource.id
                });
            }
        });
        
        // Update the batches and batch names
        imageBatches = updatedBatches;
        batchNames = Object.keys(imageBatches);
        
        console.log(`Now have ${batchNames.length} batches with images`);
    }

    // Function to reset and start fresh
    function resetAndFetchImages() {
        // Reset state
        imageBatches = {};
        batchNames = [];
        currentPage = 0;
        hasMoreImages = true;
        visibleBatchCount = INITIAL_BATCHES;
        
        // Start fetching
        fetchImagePage();
    }

    // Function to load more batches (UI)
    function loadMoreBatches() {
        if (loadingMore || visibleBatchCount >= batchNames.length) {
            // If we've shown all available batches but there might be more images, fetch more
            if (hasMoreImages && !isFetchingImages) {
                fetchImagePage();
            }
            return;
        }
        
        loadingMore = true;
        console.log('Loading more batches for display');
        
        // Increase the visible batch count
        visibleBatchCount = Math.min(visibleBatchCount + BATCHES_PER_LOAD, batchNames.length);
        
        // If we're getting close to the end of our loaded batches, fetch more images
        if (visibleBatchCount + BATCHES_PER_LOAD >= batchNames.length && hasMoreImages && !isFetchingImages) {
            fetchImagePage();
        }
        
        // Reset loading flag after a short delay
        setTimeout(() => {
            loadingMore = false;
        }, 300);
    }

    // Intersection Observer to detect when user scrolls near the bottom
    function setupIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            console.log('IntersectionObserver not supported, lazy loading disabled');
            // If not supported, just show all batches
            visibleBatchCount = batchNames.length;
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && !loadingMore) {
                loadMoreBatches();
            }
        }, {
            root: null,
            rootMargin: '300px', // Load more when within 300px of the sentinel
            threshold: 0.1
        });
        
        return observer;
    }

    // Update the observer when the sentinel element changes
    function updateObserver(observer) {
        if (!observer) return;
        
        // Disconnect from any previous elements
        observer.disconnect();
        
        // Observe the sentinel element when it exists
        setTimeout(() => {
            const sentinelElement = document.getElementById('limn-load-more-sentinel');
            if (sentinelElement) {
                observer.observe(sentinelElement);
                console.log('Observing sentinel element for lazy loading');
            }
        }, 100); // Small delay to ensure DOM is updated
    }

    // Set up subscription to listen for changes
    function setupSubscription() {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }

        if (userId) {
            console.log('Setting up subscription for resource changes');
            
            subscription = supabase
                .channel(`limn_resource_changes_${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${userId}`
                    },
                    () => {
                        // When data changes, reset and fetch fresh
                        resetAndFetchImages();
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
    let observer;
    onMount(() => {
        // Start fetching the first page of images
        fetchImagePage();
        setupSubscription();
        
        // Set up intersection observer after initial render
        observer = setupIntersectionObserver();
        updateObserver(observer);
        
        return () => {
            if (observer) {
                observer.disconnect();
            }
        };
    });

    // Update observer when batch names change
    $: if (batchNames.length > 0 && observer) {
        updateObserver(observer);
    }

    // Watch for user changes
    $: if (userId) {
        resetAndFetchImages();
        setupSubscription();
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else if batchNames.length === 0 && !isFetchingImages}
    <!-- <div class="min-h-[200px] flex items-center justify-center">
        <p class="text-gray-500 text-lg">No Limn images found in your account</p>
    </div> -->
{:else}
    <div bind:this={containerElement}>
        {#each visibleBatchNames as batchName}
            <div class="mb-4">
                <LimnGeneratorRow data={imageBatches[batchName]} ui_config={ui_config} workflow={workflow} />
            </div>
        {/each}
        
        <!-- Sentinel element for intersection observer -->
        {#if visibleBatchCount < batchNames.length || hasMoreImages}
            <div id="limn-load-more-sentinel" class="h-20 flex items-center justify-center">
                {#if isFetchingImages || loadingMore}
                    <div class="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                {:else}
                    <div class="h-10"></div>
                {/if}
            </div>
        {/if}
    </div>
{/if}