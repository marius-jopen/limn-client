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

    // Workflow names to filter by
    const workflowsToFetch = ['deforum-limn', 'deforum-limn-init'];
    
    // Object to store batches of images
    let imageBatches = {};
    let batchNames = [];
    let error = null;
    let subscription;

    // Lazy loading configuration
    const INITIAL_BATCHES = 2; // Number of batches to load initially
    const BATCHES_PER_LOAD = 2; // Number of batches to load each time
    let visibleBatchCount = INITIAL_BATCHES;
    let containerElement;
    let loadingMore = false;

    // Get user ID from store
    $: userId = $user?.id;
    
    // Compute visible batch names based on the current count
    $: visibleBatchNames = batchNames.slice(0, visibleBatchCount);

    // Function to fetch images from Supabase
    async function fetchImages() {
        if (!userId) {
            console.log('No user ID available, skipping fetch');
            return;
        }

        try {
            console.log('Fetching images for Limn Generator');
            
            let query = supabase
                .from('resource')
                .select('id, image_url, workflow_name, batch_name')
                .eq('user_id', userId)
                .in('workflow_name', workflowsToFetch)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false });
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) {
                throw new Error(fetchError.message || 'Failed to fetch images');
            }
            
            console.log(`Fetched ${data?.length || 0} images for Limn Generator`);
            
            // Group images by batch_name
            imageBatches = {};
            (data || []).forEach(resource => {
                const batchName = resource.batch_name || 'default';
                
                if (!imageBatches[batchName]) {
                    imageBatches[batchName] = [];
                }
                
                // Transform each image URL individually using transformToBunnyUrl
                imageBatches[batchName].push({
                    url: transformToBunnyUrl(resource.image_url),
                    word: resource.workflow_name,
                    id: resource.id
                });
            });
            
            // Get sorted batch names (most recent first, based on order of data)
            batchNames = Object.keys(imageBatches);
            
            console.log(`Grouped images into ${batchNames.length} batches`);
            
        } catch (e) {
            error = e.message;
            console.error('Error fetching images for Limn Generator:', e);
        }
    }

    // Function to load more batches
    function loadMoreBatches() {
        if (loadingMore || visibleBatchCount >= batchNames.length) return;
        
        loadingMore = true;
        console.log('Loading more batches');
        
        // Increase the visible batch count
        visibleBatchCount = Math.min(visibleBatchCount + BATCHES_PER_LOAD, batchNames.length);
        
        // Reset loading flag after a short delay to prevent rapid multiple loads
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
            rootMargin: '300px', // Load more when within 300px of the sentinel (increased for smoother experience)
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
                        fetchImages();
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
        fetchImages();
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
        fetchImages();
        setupSubscription();
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else if batchNames.length === 0}
    <!-- <div class="min-h-[200px] flex items-center justify-center">
        <p class="text-gray-500 text-lg">No Limn images found in your account</p>
    </div> -->
{:else}
    <div bind:this={containerElement}>
        {#each visibleBatchNames as batchName}
            <div class="mb-4">
                <LimnGeneratorRow data={imageBatches[batchName]} />
            </div>
        {/each}
        
        <!-- Sentinel element for intersection observer -->
        {#if visibleBatchCount < batchNames.length}
            <div id="limn-load-more-sentinel" class="h-20 flex items-center justify-center">
                <div class="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
        {/if}
    </div>
{/if}