<script lang="ts">
    import { onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    
    // Define interfaces for our data structures
    interface Resource {
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
    }

    interface RunStateImage {
        url?: string;
        image_url?: string;
    }

    export let workflow_name: string;
    
    let resources: Resource[] = [];
    let error: string | null = null;
    let selectedImage: Resource | null = null;
    let subscription: any; // Type will depend on your Supabase client type

    $: user_id = $user?.id;

    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Handle runState images immediately
    $: if ($runState.images?.length) {
        const newImages = $runState.images.map(img => ({
            image_url: getImageUrl(img),
            user_id: user_id,
            workflow_name: workflow_name,
            created_at: new Date().toISOString()
        }));
        
        // Merge new images with existing ones, avoiding duplicates
        const existingUrls = new Set(resources.map(r => r.image_url));
        const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.image_url));
        resources = [...uniqueNewImages, ...resources];
    }

    // Then handle database images
    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('workflow_name', workflow_name)
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            
            // Merge with existing runState images
            const existingUrls = new Set(resources.map(r => r.image_url));
            const newDbImages = data.filter(img => !existingUrls.has(img.image_url));
            resources = [...resources, ...newDbImages];
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

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
    function handleImageClick(resource: Resource): void {
        selectedImage = resource;
    }

    // Function to close overlay
    function closeOverlay(): void {
        selectedImage = null;
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <h2>{workflow_name}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8">
        {#each resources as resource}
            <div 
                class="aspect-square overflow-hidden relative group"
                role="group"
            >
                <img 
                    src={resource.image_url} 
                    alt={resource.name || 'User uploaded image'} 
                    class="w-full h-full object-cover"
                    loading="lazy"
                />
                <div class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                        class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                        on:click={() => handleImageClick(resource)}
                    >
                        View
                    </button>
                    <a
                        href={`/studio/${resource.id}`}
                        class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                    >
                        Details
                    </a>
                </div>
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
