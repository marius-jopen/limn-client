<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { user, selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    import Button from '$lib/atoms/Button.svelte';
    import Dropdown from '$lib/atoms/Dropdown.svelte'; // Import the Dropdown component

    const serverUrl = import.meta.env.VITE_SERVER_URL;

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
        batch_name?: string;
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
                const url = `${serverUrl}/resources/${localResource.id}/delete`;
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

    // Function to delete entire batch
    async function handleDeleteBatch(): Promise<void> {
        if (!localResource || !localResource.batch_name) return;
        
        try {
            console.log(`Attempting to delete batch: ${localResource.batch_name}`);
            
            // Call the API endpoint to delete the batch
            const url = `${serverUrl}/batch/delete`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ batch: localResource.batch_name })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete batch');
            }
            
            // Notify parent that batch was deleted
            dispatch('batchDeleted', {
                batchName: localResource.batch_name
            });
            
        } catch (e) {
            error = e.message;
            console.error('Error deleting batch:', e);
            alert('Failed to delete batch: ' + e.message);
        }
    }

    // Function to select this image and store its ID
    function selectImage(): void {
        if (!currentResource) return;
        
        // Store the image ID in the store
        selectedImageId.set(currentResource.id);
        console.log(`Selected image with ID: ${currentResource.id}`);
        
        // Scroll to the top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'  // Adds smooth scrolling animation
        });
        
        // Notify parent component
        dispatch('imageSelected', {
            id: currentResource.id,
            imageUrl: currentResource.image_url
        });
    }
</script>

{#if isLoading}
    <div 
        class="h-64 overflow-hidden relative flex items-center justify-center bg-gray-100"
    >
        <div class="text-gray-500">Loading...</div>
    </div>
{:else if currentResource}
    <!-- Image container with hover effect for buttons -->
    <div class="flex flex-col w-auto group  hover:scale-[1.03] transition-all duration-300 ease-in-out mt-4">
        <!-- Image tile -->
        <div class="h-[500px] overflow-hidden ">
            <img 
                on:click={handlePreview}
                src={cdnImageUrl}
                alt={currentResource.name || 'User uploaded image'} 
                class="cursor-pointer h-full w-auto object-contain rounded-md"
                loading="lazy"
            />
        </div>
        
        <!-- Button row with dropdown - simple fade in/out on hover with fly-in animation -->
        <div class="p-2 mt-5 w-full">
            <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
                <Button
                    label="Explore"
                    variant="secondary"
                    size="sm"
                    onClick={selectImage}
                />
                
                <!-- Use the slot-based Dropdown component with animated dropdown -->
                <Dropdown 
                    position="top" 
                    width="min-w-[150px]"
                    containerClass="dropdown-animate"
                >
                    <svelte:fragment slot="trigger">
                        <Button
                            label="..."
                            variant="secondary"
                            size="sm"
                        />
                    </svelte:fragment>
                    
                    <svelte:fragment slot="content">
                        <div>
                            <button 
                                class="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-300 transition-colors duration-150"
                                on:click={handleDelete}
                            >
                                Delete Image
                            </button>
                            
                            {#if localResource?.batch_name}
                                <button 
                                    class="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-300 transition-colors duration-150"
                                    on:click={handleDeleteBatch}
                                >
                                    Delete Batch
                                </button>
                            {/if}
                        </div>
                    </svelte:fragment>
                </Dropdown>
            </div>
        </div>
    </div>

    <!-- Preview overlay -->
    {#if isPreviewOpen}
        <div 
            class="fixed inset-0 bg-neutral-100/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in"
            on:click={closePreview}
        >
            <div class="max-w-4xl max-h-[90vh] relative">
                <img 
                    src={cdnImageUrl} 
                    alt={currentResource.name || 'Preview'} 
                    class="max-w-full max-h-[90vh] object-contain rounded-md"
                />
                
                <!-- Using Button atom for the close button -->
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
{:else if error}
    <div class="h-64 overflow-hidden relative flex items-center justify-center bg-gray-100">
        <div class="text-red-500 p-2 text-center text-sm">
            Error: {error}
        </div>
    </div>
{:else}
    <div class="h-64 overflow-hidden relative flex items-center justify-center bg-gray-100">
        <div class="text-gray-500">No image</div>
    </div>
{/if}

<style>
    /* Animation for preview overlay */
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* Animation for dropdown */
    :global(.dropdown-animate) {
        animation: dropdownFly 0.25s ease-out;
        transform-origin: bottom center;
    }
    
    @keyframes dropdownFly {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
