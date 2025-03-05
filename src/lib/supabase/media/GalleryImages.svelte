<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';  // Import the store
    
    // Configuration for pagination
    const IMAGES_PER_PAGE = 40; // Number of images to load initially and on each "Load More" click
    
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
    export let workflow_names: string[] = [];
    export let type: 'uploaded' | 'generated' | undefined = undefined;
    
    // Pagination state
    let allResources: Resource[] = []; // All fetched resources
    let displayedResources: Resource[] = []; // Resources currently displayed
    let displayCount = IMAGES_PER_PAGE; // Number of resources to display
    let hasMoreToLoad = false; // Whether there are more resources to load
    
    // Log props on mount
    onMount(() => {
        console.log('GalleryImages component mounted with props:', {
            workflow_name,
            workflow_names,
            type
        });
        
        // Debug: Check database schema
        checkDatabaseSchema();
    });
    
    // Combine both props into a single array for internal use
    $: workflowsToFetch = workflow_name 
        ? [workflow_name] 
        : workflow_names;
        
    $: console.log('workflowsToFetch updated:', workflowsToFetch);
    
    let resources: Resource[] = [];
    let error: string | null = null;
    let selectedImage: Resource | null = null;
    let subscription: any; // Type will depend on your Supabase client type

    $: user_id = $user?.id;

    // Update displayed resources when allResources or displayCount changes
    $: {
        displayedResources = allResources.slice(0, displayCount);
        hasMoreToLoad = allResources.length > displayCount;
    }

    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Handle runState images immediately
    $: if ($runState.images?.length) {
        const newImages = $runState.images.map(img => ({
            id: crypto.randomUUID(), // Add a random UUID for the id
            image_url: getImageUrl(img),
            user_id: user_id,
            workflow_name: workflow_name,
            created_at: new Date().toISOString()
        }));
        
        // Merge new images with existing ones, avoiding duplicates
        const existingUrls = new Set(allResources.map(r => r.image_url));
        const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.image_url));
        allResources = [...uniqueNewImages, ...allResources];
    }

    // Function to load more images
    function loadMore() {
        displayCount += IMAGES_PER_PAGE;
    }

    // Modify fetchUserImages to handle new filtering logic
    async function fetchUserImages() {
        try {
            if (!user_id) {
                console.log('No user_id available, skipping fetch');
                return;
            }
            
            console.log('Fetching images with filters:', { 
                type, 
                workflowsToFetch,
                user_id
            });
            
            let fetchedResources: Resource[] = [];
            
            // First, fetch uploaded images
            if (type === 'uploaded') {
                console.log('Fetching uploaded images');
                const { data: uploadedData, error: uploadedError } = await supabase
                    .from('resource')
                    .select('*')
                    .eq('user_id', user_id)
                    .eq('type', 'uploaded')
                    .or('visibility.is.null,visibility.eq.true')
                    .order('created_at', { ascending: false });
                
                if (uploadedError) {
                    console.error('Error fetching uploaded images:', uploadedError);
                } else if (uploadedData) {
                    console.log('Fetched uploaded images:', uploadedData);
                    fetchedResources = [...uploadedData];
                }
            }
            
            // Then, if we have workflow names, fetch those images too
            if (workflowsToFetch.length > 0) {
                console.log('Fetching workflow images:', workflowsToFetch);
                const { data: workflowData, error: workflowError } = await supabase
                    .from('resource')
                    .select('*')
                    .eq('user_id', user_id)
                    .in('workflow_name', workflowsToFetch)
                    .or('visibility.is.null,visibility.eq.true')
                    .order('created_at', { ascending: false });
                
                if (workflowError) {
                    console.error('Error fetching workflow images:', workflowError);
                } else if (workflowData) {
                    console.log('Fetched workflow images:', workflowData);
                    
                    // Merge with existing resources, avoiding duplicates
                    const existingIds = new Set(fetchedResources.map(r => r.id));
                    const newWorkflowImages = workflowData.filter(img => !existingIds.has(img.id));
                    fetchedResources = [...fetchedResources, ...newWorkflowImages];
                }
            }
            
            console.log('Final combined resources:', fetchedResources);
            allResources = fetchedResources;
            
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
            // Create separate subscriptions for uploaded and workflow images
            const channels = [];
            
            // Subscribe to uploaded images if needed
            if (type === 'uploaded') {
                console.log('Setting up subscription for uploaded images');
                const uploadedChannel = supabase
                    .channel('uploaded_changes')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'resource',
                            filter: `user_id=eq.${user_id} AND type=eq.uploaded`
                        },
                        () => {
                            fetchUserImages();
                        }
                    )
                    .subscribe();
                
                channels.push(uploadedChannel);
            }
            
            // Subscribe to workflow images if needed
            if (workflowsToFetch.length > 0) {
                console.log('Setting up subscription for workflow images');
                
                // Create a separate subscription for each workflow
                workflowsToFetch.forEach(wf => {
                    const workflowChannel = supabase
                        .channel(`workflow_${wf}_changes`)
                        .on(
                            'postgres_changes',
                            {
                                event: '*',
                                schema: 'public',
                                table: 'resource',
                                filter: `user_id=eq.${user_id} AND workflow_name=eq.${wf}`
                            },
                            () => {
                                fetchUserImages();
                            }
                        )
                        .subscribe();
                    
                    channels.push(workflowChannel);
                });
            }
            
            // Store all channels for cleanup
            subscription = channels;
        }
    }

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        if (subscription) {
            if (Array.isArray(subscription)) {
                subscription.forEach(channel => {
                    if (channel && typeof channel.unsubscribe === 'function') {
                        channel.unsubscribe();
                    }
                });
            } else if (typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        }
    });

    // Update the reactive statement to include workflowsToFetch
    $: {
        if (user_id) {
            setupSubscription();
            allResources = []; // Clear existing resources
            fetchUserImages();
            
            // Debug query to check for any uploaded images
            if (type === 'uploaded') {
                checkForAnyUploadedImages();
            }
        }
    }

    // Debug function to check if there are any uploaded images at all
    async function checkForAnyUploadedImages() {
        try {
            console.log('DEBUG: Checking for any uploaded images');
            
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('type', 'uploaded')
                .limit(10);
                
            if (supabaseError) {
                console.error('DEBUG: Supabase error when checking for uploads:', supabaseError);
                return;
            }
            
            console.log('DEBUG: Found uploaded images (regardless of workflow):', data);
        } catch (e) {
            console.error('DEBUG: Error checking for uploads:', e);
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
            allResources = allResources.filter(r => r.id !== resource.id);
        } catch (e) {
            error = e.message;
            console.error('Error deleting image:', e);
            alert('Failed to delete image: ' + e.message);
        }
    }

    async function checkDatabaseSchema() {
        try {
            console.log('DEBUG: Checking database schema');
            
            // First, get a sample resource to check its structure
            const { data: sampleData, error: sampleError } = await supabase
                .from('resource')
                .select('*')
                .limit(1);
                
            if (sampleError) {
                console.error('DEBUG: Error fetching sample data:', sampleError);
                return;
            }
            
            if (sampleData && sampleData.length > 0) {
                console.log('DEBUG: Sample resource structure:', sampleData[0]);
                
                // Check if the type field exists
                if (!('type' in sampleData[0])) {
                    console.warn('DEBUG: The "type" field does not exist in the resource table!');
                }
            } else {
                console.log('DEBUG: No resources found in the database');
            }
        } catch (e) {
            console.error('DEBUG: Error checking database schema:', e);
        }
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8">
        {#if displayedResources.length > 0}
            {#each displayedResources as resource}
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
        {:else}
            <div class="col-span-full min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                <p class="text-gray-500 text-lg">No images available</p>
            </div>
        {/if}
    </div>
    
    {#if hasMoreToLoad}
        <div class="mt-4 flex justify-center">
            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md"
                on:click={loadMore}
            >
                Load More ({displayedResources.length} of {allResources.length})
            </button>
        </div>
    {/if}
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
                class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                on:click={closeOverlay}
            >
                ✕
            </button>
        </div>
    </div>
{/if}
