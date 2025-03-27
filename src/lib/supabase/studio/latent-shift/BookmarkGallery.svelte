<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    import Button from '$lib/atoms/Button.svelte';

    // Configuration for pagination
    const ITEMS_PER_PAGE = 20;

    // Define interface for our data structure
    interface Resource {
        id: string;
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
        visibility?: boolean;
        type?: string;
        liked?: boolean;
    }

    // State variables
    let likedResources: Resource[] = [];
    let isLoading = false;
    let error: string | null = null;
    let hasMore = true;
    let page = 0;

    // Get user ID from store
    $: userId = $user?.id;

    // Grid layout state
    $: gridClass = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4";

    // Fetch liked images from Supabase
    async function fetchLikedImages() {
        if (!userId || isLoading || !hasMore) return;

        try {
            isLoading = true;
            console.log(`Fetching liked images for user ${userId}, page ${page}`);

            const { data, error: fetchError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', userId)
                .eq('liked', true)
                .order('created_at', { ascending: false })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            // Transform S3 URLs to Bunny.net URLs if needed
            const transformedData = transformResourceUrls(data || []);

            // Update state
            likedResources = [...likedResources, ...transformedData];
            page += 1;
            hasMore = (data?.length || 0) === ITEMS_PER_PAGE;

            console.log(`Fetched ${data?.length} liked images, total now: ${likedResources.length}`);

        } catch (e) {
            error = e.message;
            console.error('Error fetching liked images:', e);
        } finally {
            isLoading = false;
        }
    }

    // Set up real-time subscription for likes
    let subscription: any;

    function setupSubscription() {
        if (!userId) return;

        subscription = supabase
            .channel(`liked_resources_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'resource',
                    filter: `user_id=eq.${userId} AND liked=eq.true`
                },
                () => {
                    // Refresh the entire list when changes occur
                    resetAndFetch();
                }
            )
            .subscribe();
    }

    // Function to reset state and fetch images
    function resetAndFetch() {
        likedResources = [];
        page = 0;
        hasMore = true;
        fetchLikedImages();
    }

    // Load more images
    async function loadMore() {
        if (!isLoading && hasMore) {
            await fetchLikedImages();
        }
    }

    // Initial setup
    onMount(() => {
        if (userId) {
            setupSubscription();
            fetchLikedImages();
        }
    });

    // Cleanup
    onDestroy(() => {
        if (subscription) {
            subscription.unsubscribe();
        }
    });

    // Watch for user changes
    $: if (userId) {
        resetAndFetch();
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class={gridClass}>
        {#each likedResources as resource (resource.id)}
            <div class="relative group">
                <img
                    src={resource.image_url}
                    alt={resource.name || 'Liked image'}
                    class="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                />
                <div class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p class="text-sm truncate">{resource.workflow_name}</p>
                    <p class="text-xs opacity-75">{new Date(resource.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        {/each}
    </div>

    {#if hasMore}
        <div class="py-6 flex justify-center">
            {#if isLoading}
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
                />
            {/if}
        </div>
    {/if}
{/if}

<style>
    /* Add any additional styles here */
</style>
