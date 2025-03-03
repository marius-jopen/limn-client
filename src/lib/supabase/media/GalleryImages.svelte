<script lang="ts">
    import { onDestroy } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    
    // Define interfaces for our data structures
    interface Resource {
        id: string;
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
        visibility?: boolean;
        type?: 'uploaded' | 'generated' | string; // Add type field
    }

    interface RunStateImage {
        url?: string;
        image_url?: string;
    }

    export let workflow_name: string | undefined = undefined;
    export let type: 'uploaded' | 'generated' | undefined = undefined;
    
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

    // Modify fetchUserImages to handle new filtering logic
    async function fetchUserImages() {
        try {
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .or('visibility.is.null,visibility.eq.true');

            // Add workflow_name filter if provided
            if (workflow_name) {
                query = query.eq('workflow_name', workflow_name);
            }

            // Add type filter if provided
            if (type) {
                query = query.eq('type', type);
            }

            const { data, error: supabaseError } = await query
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
        if (subscription) {
            subscription.unsubscribe();
        }

        if (user_id) {
            let filter = `user_id=eq.${user_id}`;
            if (workflow_name) {
                filter += ` AND workflow_name=eq.${workflow_name}`;
            }
            if (type) {
                filter += ` AND type=eq.${type}`;
            }

            subscription = supabase
                .channel('resource_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter
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

    // Update the reactive statement to include type
    $: {
        if (user_id) {
            setupSubscription();
            resources = []; // Clear existing resources
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

    // Add this function after the closeOverlay function
    async function handleDeleteImage(resource: Resource): Promise<void> {
        try {
            const url = `http://localhost:4000/api/resources/${resource.id}/delete`;
            console.log('Attempting to delete resource at URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Log response details for debugging
            console.log('Response status:', response.status);
            console.log('Response type:', response.headers.get('content-type'));

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete image');
            }

            // Only remove from UI if deletion was successful
            resources = resources.filter(r => r.id !== resource.id);
        } catch (e) {
            error = e.message;
            console.error('Error deleting image:', e);
            alert('Failed to delete image: ' + e.message);
        }
    }
</script>

<!-- Remove the filter buttons and simplify the header -->
<div class="mb-4">
    <h2>{type || workflow_name || 'Gallery'}</h2>
</div>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
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
                <div class="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center flex-col justify-center gap-2 p-2">
                    <button
                        class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                        on:click={() => handleImageClick(resource)}
                    >
                        Preview
                    </button>
                    <a
                        href={`/studio/${resource.id}`}
                        class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                    >
                        Details
                    </a>
                    <a
                        href={`/studio/deforum/${resource.id}`}
                        class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 shadow-md"
                    >
                        Deforum
                    </a>
                    <button
                        class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow-md"
                        on:click={() => handleDeleteImage(resource)}
                    >
                        Delete
                    </button>
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
