<script>
    import { user } from '../stores/store-supabase';
    import { supabase } from './helper/supabaseClient';
    import { onDestroy } from 'svelte';
    
    export let workflow_name;
    
    let resources = [];
    let error = null;

    $: user_id = $user?.id;

    // Add state for selected image
    let selectedImage = null;

    // Add state for animation intervals and current indices
    let batchIntervals = new Map();
    let batchCurrentIndices = new Map();

    // Add state for overlay animation
    let overlayInterval;
    let overlayCurrentIndex = 0;
    let overlayImages = [];

    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('workflow_name', workflow_name);

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

    // Modify handleImageClick to setup overlay animation
    function handleImageClick(resource) {
        const batchName = Object.entries(groupedResources).find(([_, resources]) => 
            resources.includes(resource)
        )[0];
        overlayImages = groupedResources[batchName];
        overlayCurrentIndex = overlayImages.indexOf(resource);
        
        // Start overlay animation
        if (overlayInterval) clearInterval(overlayInterval);
        overlayInterval = setInterval(() => {
            overlayCurrentIndex = (overlayCurrentIndex + 1) % overlayImages.length;
        }, 67); // Same 15fps as grid animations
        
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

    // Add computed property to group resources by batch_name
    $: groupedResources = resources.reduce((groups, resource) => {
        const batchName = resource.batch_name || 'Uncategorized';
        if (!groups[batchName]) {
            groups[batchName] = [];
        }
        groups[batchName].push(resource);
        return groups;
    }, {});

    // Function to start animation for a batch
    function startBatchAnimation(batchName, batchResources) {
        if (batchIntervals.has(batchName)) {
            clearInterval(batchIntervals.get(batchName));
        }

        batchCurrentIndices.set(batchName, 0);
        const interval = setInterval(() => {
            batchCurrentIndices.set(
                batchName,
                (batchCurrentIndices.get(batchName) + 1) % batchResources.length
            );
            batchCurrentIndices = batchCurrentIndices; // Trigger reactivity
        }, 67); // ~15 frames per second (1000ms / 15)
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
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <h2>{workflow_name}</h2>
    <div class="flex flex-col">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {#each Object.entries(groupedResources) as [batchName, batchResources]}
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
            {/each}
        </div>
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
