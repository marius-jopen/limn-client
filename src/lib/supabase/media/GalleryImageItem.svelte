<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';

    // Define the Resource interface
    interface Resource {
        id: string;
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
        visibility?: boolean;
        type?: 'uploaded' | 'generated' | string;
    }

    // Props - can receive full resource or just the ID
    export let resource: Resource | null = null;
    export let resourceId: string | null = null;
    
    // Event dispatcher for parent component communication
    const dispatch = createEventDispatcher();
    
    // Local state
    let isPreviewOpen = false;
    let error: string | null = null;
    let isLoading = false;
    let localResource: Resource | null = resource;
    
    // Get user ID from store
    $: userId = $user?.id;

    // If we only have resourceId, fetch the full resource on mount
    onMount(async () => {
        if (!localResource && resourceId) {
            await fetchResource();
        }
    });
    
    // Fetch resource data if we only have the ID
    async function fetchResource() {
        if (!resourceId || !userId) return;
        
        isLoading = true;
        try {
            console.log(`Fetching resource details for ID: ${resourceId}`);
            
            const { data, error: fetchError } = await supabase
                .from('resource')
                .select('*')
                .eq('id', resourceId)
                .eq('user_id', userId)
                .single();
                
            if (fetchError) {
                throw new Error(fetchError.message || 'Failed to fetch resource details');
            }
            
            if (data) {
                localResource = data;
                console.log('Resource fetched successfully', localResource);
            } else {
                throw new Error('Resource not found');
            }
        } catch (e) {
            error = e.message;
            console.error('Error fetching resource:', e);
        } finally {
            isLoading = false;
        }
    }

    // Function to handle image click for preview
    function handlePreview(): void {
        isPreviewOpen = true;
    }

    // Function to close preview overlay
    function closePreview(): void {
        isPreviewOpen = false;
    }

    // Function to delete image using Supabase directly
    async function handleDelete(): Promise<void> {
        if (!localResource) return;
        
        try {
            console.log(`Attempting to delete resource with ID: ${localResource.id}`);
            
            // First try API endpoint if available
            try {
                const url = `http://localhost:4000/api/resources/${localResource.id}/delete`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // API call successful
                    notifyDeletion();
                    return;
                }
                
                // If API call fails, fall back to direct Supabase deletion
                console.log('API call failed, falling back to Supabase:', data.message);
            } catch (apiError) {
                console.error('API call failed, falling back to Supabase:', apiError);
            }
            
            // Delete directly from Supabase
            const { error: deleteError } = await supabase
                .from('resource')
                .delete()
                .eq('id', localResource.id)
                .eq('user_id', userId);
                
            if (deleteError) {
                throw new Error(deleteError.message || 'Failed to delete image');
            }
            
            notifyDeletion();
            
        } catch (e) {
            error = e.message;
            console.error('Error deleting image:', e);
            alert('Failed to delete image: ' + e.message);
        }
    }
    
    // Helper function to notify parent that image was deleted
    function notifyDeletion() {
        if (!localResource) return;
        
        // Notify parent that image was deleted
        dispatch('imageDeleted', {
            id: localResource.id
        });
    }
    
    // Derived value to get the actual resource (either from prop or locally fetched)
    $: currentResource = localResource || resource;
</script>

{#if isLoading}
    <div 
        class="aspect-square overflow-hidden relative flex items-center justify-center bg-gray-100"
    >
        <div class="text-gray-500">Loading...</div>
    </div>
{:else if currentResource}
    <!-- Image tile -->
    <div 
        class="aspect-square overflow-hidden relative group"
        role="group"
    >
        <img 
            src={currentResource.image_url}
            alt={currentResource.name || 'User uploaded image'} 
            class="w-full h-full object-cover"
            loading="lazy"
        />
        <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <div class="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                <button
                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    on:click={handlePreview}
                    title="Preview"
                >
                    🔍
                </button>
                <a
                    href={`/studio/${currentResource.id}`}
                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    title="Details"
                >
                    ℹ️
                </a>
                <a
                    href={`/studio/deforum/${currentResource.id}`}
                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    title="Deforum"
                >
                    🎞️
                </a>
                <button
                    class="bg-white text-white rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    on:click={handleDelete}
                    title="Delete"
                >
                    🗑️
                </button>
            </div>
        </div>
    </div>

    <!-- Preview overlay -->
    {#if isPreviewOpen}
        <div 
            class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            on:click={closePreview}
            on:keydown={(e) => e.key === 'Escape' && closePreview()}
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
                    src={currentResource.image_url} 
                    alt={currentResource.name || 'User uploaded image'} 
                    class="max-w-full max-h-[90vh] object-contain"
                />
                <button 
                    class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                    on:click={closePreview}
                >
                    ✕
                </button>
            </div>
        </div>
    {/if}
{:else}
    <div 
        class="aspect-square overflow-hidden relative flex items-center justify-center bg-gray-100"
    >
        <div class="text-gray-500">Image not found</div>
    </div>
{/if}

<!-- Display error if any -->
{#if error}
    <div class="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs rounded">
        Error: {error}
    </div>
{/if}
