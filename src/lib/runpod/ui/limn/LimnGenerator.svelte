<script>
    import { onMount, onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    import LimnGeneratorRow from '$lib/runpod/ui/limn/LimnGeneratorRow.svelte';

    // Define interface for our data structure
    /**
     * @typedef {Object} Resource
     * @property {string} id - The unique identifier for the resource
     * @property {string} image_url - URL to the image
     * @property {string} user_id - ID of the user who owns the resource
     * @property {string} workflow_name - Name of the workflow that generated the resource
     * @property {string} created_at - Timestamp when the resource was created
     * @property {string} [name] - Optional name for the resource
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

    // Get user ID from store
    $: userId = $user?.id;

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
            
            // Transform S3 URLs to Bunny.net URLs if needed
            const transformedData = transformResourceUrls(data || []);
            
            // Group images by batch_name
            imageBatches = {};
            transformedData.forEach(resource => {
                const batchName = resource.batch_name || 'default';
                
                if (!imageBatches[batchName]) {
                    imageBatches[batchName] = [];
                }
                
                imageBatches[batchName].push({
                    url: resource.image_url,
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
    onMount(() => {
        fetchImages();
        setupSubscription();
    });

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
    {#each batchNames as batchName}
        <div class="mb-4">
            <LimnGeneratorRow data={imageBatches[batchName]} />
        </div>
    {/each}
{/if}