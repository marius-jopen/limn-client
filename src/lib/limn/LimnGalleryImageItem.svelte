<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';

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

    // Transform the S3 URL to Bunny.net URL
    $: cdnImageUrl = currentResource ? transformToBunnyUrl(currentResource.image_url) : null;
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
            src={cdnImageUrl}
            alt={currentResource.name || 'User uploaded image'} 
            class="w-full h-full object-cover"
            loading="lazy"
        />
        <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-1">
                <button
                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    on:click={handlePreview}
                    title="Preview"
                >
                    🔍
                </button>
                <a
                    href={`/studio/deforum-limn/${currentResource.id}`}
                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                    title="Deforum Limn"
                >
                ☀️
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
            class="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            on:click={closePreview}
        >
            <div class="max-w-4xl max-h-[90vh] relative">
                <img 
                    src={cdnImageUrl} 
                    alt={currentResource.name || 'Preview'} 
                    class="max-w-full max-h-[90vh] object-contain"
                />
                <button 
                    class="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-black"
                    on:click={closePreview}
                >
                    ✕
                </button>
            </div>
        </div>
    {/if}
{:else if error}
    <div class="aspect-square overflow-hidden relative flex items-center justify-center bg-gray-100">
        <div class="text-red-500 p-2 text-center text-sm">
            Error: {error}
        </div>
    </div>
{:else}
    <div class="aspect-square overflow-hidden relative flex items-center justify-center bg-gray-100">
        <div class="text-gray-500">No image</div>
    </div>
{/if}
