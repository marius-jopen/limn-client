<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    import Button from '$lib/atoms/Button.svelte';
    import Like from '$lib/supabase/studio/latent-shift/Like.svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';

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
    $: gridClass = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 ";

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

    // Add function to handle like changes
    function handleLikeChanged(event: CustomEvent) {
        const { resourceId, liked } = event.detail;
        if (!liked) {
            // Remove the unliked image from the gallery immediately
            likedResources = likedResources.filter(resource => resource.id !== resourceId);
        }
    }

    function handleGenerateClick() {
        goto('/studio/latent-shift');
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else if likedResources.length === 0 && !isLoading}
    <div class="flex justify-center items-center p-36">
        <div class="bg-white rounded-lg p-8 text-center max-w-md">
            <h3 class="text-xl font-medium mb-4 mt-3">No Bookmarks Yet</h3>
            <p class="text-neutral-600 mb-6">
                If you see this, that means that you haven't bookmarked any images yet. 
            </p>

            <p class="text-neutral-600 mb-6">
                Feel free to generate some images <a href="/studio/latent-shift" class="text-gray-900 hover:underline">here</a>.
            </p>

            <a href="/studio/latent-shift" class="text-neutral-600 pb-10 group">
                <div class="text-3xl smooth-float">
                    🚀
                </div>
            </a>
        </div>
    </div>
{:else}
    <div class="">
        <h2 class="text-xl font-medium text-gray-700 mb-6 text-center pt-20 pb-8">
            Your Bookmarked Images. Yay!
        </h2>

        <div class={gridClass}>
            {#each likedResources as resource (resource.id)}
                <div 
                    class="relative overflow-hidden rounded-lg group"
                    transition:fade={{ duration: 300 }}
                >
                    <img
                        src={resource.image_url}
                        alt={resource.name || 'Liked image'}
                        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                    />
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Like 
                            resourceId={resource.id}
                            initialLiked={true}
                            on:likeChanged={handleLikeChanged}
                        />
                    </div>
                </div>
            {/each}
        </div>
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
    /* Ensure smooth transitions for grid items */
    :global(.grid) {
        transition: all 300ms ease-in-out;
    }

    /* Add rocket animation styles */
    @keyframes float {
        0% {
            transform: translateY(0) rotate(-2deg);
        }
        25% {
            transform: translateY(-4px) rotate(2deg);
        }
        50% {
            transform: translateY(-8px) rotate(-1deg);
        }
        75% {
            transform: translateY(-4px) rotate(1deg);
        }
        100% {
            transform: translateY(0) rotate(-2deg);
        }
    }

    .smooth-float {
        transition: transform 0.3s ease-in-out;
    }

    .group:hover .smooth-float {
        animation: float 3s ease-in-out infinite;
    }
</style>
