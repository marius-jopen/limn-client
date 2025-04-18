<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformResourceUrls } from '$lib/bunny/BunnyClient';
    import Button from '$lib/atoms/Button.svelte';
    import Like from '$lib/supabase/studio/latent-shift/Like.svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import ContinuousDeforumVideo from './ContinuousDeforumVideo.svelte';

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
        batch_name?: string;
        batches_connected?: Array<{batch_name: string, id: string}>;
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

    // Add preview state
    let isPreviewOpen = false;
    let previewResource: Resource | null = null;

    // Add state for video preview
    let showVideoPreview = false;
    let selectedPathResources: Resource[] = [];

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

    // Function to handle image click for preview
    function handlePreview(resource: Resource): void {
        previewResource = resource;
        isPreviewOpen = true;
    }

    // Function to close preview overlay
    function closePreview(): void {
        isPreviewOpen = false;
        previewResource = null;
    }

    // Function to handle image selection and navigation
    async function handleExploreImage(resource: Resource) {
        // Set the selected image ID in the store
        selectedImageId.set(resource.id);

        // Update runState with a fresh state, only including necessary info
        runState.update(state => ({
            ...state,
            workflow_name: 'deforum-latent-shift',
            imageId: resource.id,
            // Reset connected batches to ensure no lineage is continued
            connectedBatches: [],
            values: {
                ...state.values,
                init_image: resource.id
            }
        }));

        // Navigate to latent-shift page
        await goto('/studio/latent-shift');
    }

    // Function to fetch complete lineage for an image
    async function fetchImageLineage(resource: Resource) {
        try {
            console.log('Fetching lineage for resource:', resource.id);
            
            let processedBatches = new Set<string>();
            let allResources: Resource[] = [];

            // Helper function to recursively collect all connected resources
            async function collectBatchResources(batchName: string) {
                if (processedBatches.has(batchName)) return;
                processedBatches.add(batchName);

                // Get all images from this batch
                const { data: batchImages, error: batchError } = await supabase
                    .from('resource')
                    .select('*')
                    .eq('batch_name', batchName);

                if (batchError) throw batchError;
                
                if (batchImages) {
                    // Add all images from this batch
                    allResources.push(...batchImages);

                    // Process connected batches for each image in this batch
                    for (const img of batchImages) {
                        if (img.batches_connected) {
                            for (const connected of img.batches_connected) {
                                await collectBatchResources(connected.batch_name);
                            }
                        }
                    }
                }
            }

            // Start with the current image's batch
            if (resource.batch_name) {
                await collectBatchResources(resource.batch_name);
            }

            // If the current image has connected batches, process those too
            if (resource.batches_connected) {
                for (const connected of resource.batches_connected) {
                    await collectBatchResources(connected.batch_name);
                }
            }

            // If no resources were found, at least include the current resource
            if (allResources.length === 0) {
                allResources = [resource];
            }

            // Remove duplicates and sort by creation time
            const uniqueResources = Array.from(new Set(allResources.map(r => JSON.stringify(r))))
                .map(str => JSON.parse(str))
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            console.log(`Found ${uniqueResources.length} images in the complete family tree`);
            return uniqueResources;

        } catch (error) {
            console.error('Error fetching image lineage:', error);
            return [resource];
        }
    }

    // Update the handleShowVideo function
    async function handleShowVideo(resource: Resource) {
        console.log('Starting video preview for resource:', resource.id);
        const lineageResources = await fetchImageLineage(resource);
        console.log(`Got ${lineageResources.length} images for video`);
        selectedPathResources = lineageResources;
        showVideoPreview = true;
    }
</script>

<!-- <div>
    <h1 class="text-center mb-4 md:mb-6 pt-8 bg-red-300 rounded-lg p-10 w-fit mx-auto mt-20 mb-8 floating-message">
        👋 <br> Hello! <br> Image generation is currently deactivated! <br> 🫢
    </h1>
</div> -->

{#if error}
    <p class="text-red-400 md:p-4">{error}</p>
{:else if likedResources.length === 0 && !isLoading}
    <div class="flex justify-center items-center pt-20 md:pt-36">
        <div class="bg-white rounded-lg p-6 md:p-8 text-center w-full md:max-w-md md:mx-0">
            <h3 class="text-lg md:text-xl font-medium mb-3 md:mb-4 mt-2 md:mt-3">
                Welcome to Limn!
            </h3>
            
            <p class="text-sm md:text-base text-neutral-600 mb-4 md:mb-6">
                Feel free to generate some images <a href="/studio/latent-shift" class="text-gray-900 hover:underline">here</a>.
            </p>

            <p class="text-sm md:text-base text-neutral-600 mb-4 md:mb-6">
                You can also like your favorite creations and they will appear here.
            </p>

            <a href="/studio/latent-shift" class="text-neutral-600 pb-6 md:pb-4 group inline-block">
                <div class="text-2xl md:text-3xl smooth-float">
                    🚀
                </div>
            </a>
        </div>
    </div>
{:else}
    <div class="">

        <div class="flex justify-center pt-16 pb-24">
            <Button
                label="🔮 Explore"
                variant="secondary"
                size="lg"
                onClick={handleGenerateClick}
            />
        </div>
        
        
        <!-- <h2 class="text-2xl text-center font-medium text-neutral-800 pt-16 pb-10">
            Images you liked 😀
        </h2> -->

        <div class={gridClass}>
            {#each likedResources as resource (resource.id)}
                <div 
                    class="relative overflow-hidden rounded-lg group"
                    transition:fade={{ duration: 300 }}
                >
                    <img
                        src={resource.image_url}
                        alt={resource.name || 'Liked image'}
                        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                        loading="lazy"
                        on:click={() => handlePreview(resource)}
                    />
                        <div 
                            class="absolute bottom-2 left-0 w-full justify-center flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            on:click|stopPropagation
                        >
                        <!-- <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleExploreImage(resource)}
                        >
                            🔮
                        </Button> -->
                      
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleShowVideo(resource)}
                        >
                            <span class="md:hidden">🎬</span>
                            <span class="hidden md:block">🎬</span>
                        </Button>

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

    <!-- Preview overlay -->
    {#if isPreviewOpen && previewResource}
        <div 
            class="fixed inset-0 bg-neutral-100/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in"
            on:click={closePreview}
        >
            <div class="max-w-4xl max-h-[90vh] relative">
                <img 
                    src={previewResource.image_url} 
                    alt={previewResource.name || 'Preview'} 
                    class="max-w-full max-h-[90vh] object-contain rounded-xl"
                />
                
                <div class="fixed top-3 right-4">
                    <Button
                        label="Close"
                        variant="secondary"
                        size="sm"
                        onClick={closePreview}
                    />
                </div>
            </div>
        </div>
    {/if}

    <!-- Add video preview overlay -->
    {#if showVideoPreview}
        <ContinuousDeforumVideo 
            resources={selectedPathResources}
            on:close={() => showVideoPreview = false}
        />
    {/if}

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

    /* Animation for preview overlay */
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Add floating animation for the message */
    .floating-message {
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px);
        }
        100% {
            transform: translateY(0px);
        }
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
