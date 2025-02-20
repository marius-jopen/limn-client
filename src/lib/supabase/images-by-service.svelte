<script>
    import { user } from '../stores/auth';
    import { supabase } from '../supabase/supabaseClient';
    import { onDestroy } from 'svelte';
    import { runState } from '../runpod/helper/store-run.js';  // Import the store
    
    export let workflow_name;
    
    let resources = [];
    let error = null;
    let currentImages = [];

    $: user_id = $user?.id;

    // Add state for selected image
    let selectedImage = null;

    // Subscribe to runState to watch for new images
    runState.subscribe(state => {
        if (state.images?.length && state.images !== currentImages) {
            currentImages = state.images;
            // Add the new images to the beginning of resources array
            resources = [...state.images.map(img => ({
                image_url: img,
                user_id: user_id,
                workflow_name: workflow_name,
                created_at: new Date().toISOString()
            })), ...resources];
        }
    });

    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('workflow_name', workflow_name)
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
    });

    // Setup subscription and fetch images when user_id or workflow_name changes
    $: {
        if (user_id && workflow_name) {
            setupSubscription();
            fetchUserImages();
        }
    }

    // Function to handle image click
    function handleImageClick(resource) {
        selectedImage = resource;
    }

    // Function to close overlay
    function closeOverlay() {
        selectedImage = null;
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8">
        {#each resources as resource}
            <div 
                class="aspect-square overflow-hidden cursor-pointer"
                on:click={() => handleImageClick(resource)}
                on:keydown={(e) => e.key === 'Enter' && handleImageClick(resource)}
                role="button"
                tabindex="0"
            >
                <img 
                    src={resource.image_url} 
                    alt={resource.name || 'User uploaded image'} 
                    class="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        {/each}
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
            on:keydown|stopPropagation={() => {}}
            role="presentation"
        >
            <img 
                src={selectedImage.image_url} 
                alt={selectedImage.name || 'User uploaded image'} 
                class="max-w-full max-h-[90vh] object-contain"
            />
            <button 
                class="absolute top-4 right-4 text-white p-2 hover:bg-opacity-75"
                on:click={closeOverlay}
            >
                ✕
            </button>
        </div>
    </div>
{/if}
