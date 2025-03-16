<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import LimnGalleryImageItem from './LimnGalleryImageItem.svelte';
    import { transformResourceUrls, transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    
    // Configuration
    const IMAGES_PER_PAGE = 40;
    const SYNC_INTERVAL = 3000; // Check for updates every 3 seconds
    
    // Define interfaces
    interface Resource {
        id: string;
        image_url: string;
        user_id: string;
        workflow_name: string;
        created_at: string;
        name?: string;
        visibility?: boolean;
        type?: 'uploaded' | 'generated' | string;
        _isTemporary?: boolean;
        _originalUrl?: string; // Store the original S3 URL
    }

    interface RunStateImage {
        url?: string;
        image_url?: string;
    }

    // Props
    export let workflow_name: string | undefined = undefined;
    export let workflow_names: string[] = [];
    export let type: string | string[] | undefined = undefined;
    export let defaultImagesPerRow: number = 8;
    
    // Convert type to array if it's a string
    $: typeArray = typeof type === 'string' ? [type] : Array.isArray(type) ? type : [];
    
    // Grid layout state
    $: gridClass = getGridClass(defaultImagesPerRow);
    
    // State variables
    let allResources: Resource[] = [];
    let displayedResources: Resource[] = [];
    let displayCount = IMAGES_PER_PAGE;
    let hasMoreToLoad = true;
    let error: string | null = null;
    let subscription: any;
    let isLoading = false;
    let syncTimer: number | null = null;
    let lastSyncTime = 0;
    
    // Get user ID from store
    $: user_id = $user?.id;
    
    // Combine workflow props into a single array
    $: workflowsToFetch = workflow_name ? [workflow_name] : workflow_names;
    
    // Update displayed resources when allResources or displayCount changes
    $: {
        displayedResources = allResources.slice(0, displayCount);
    }

    // Grid class helper function
    function getGridClass(columns) {
        const baseClasses = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
        
        switch(columns) {
            case 4: return `${baseClasses} lg:grid-cols-4`;
            case 5: return `${baseClasses} lg:grid-cols-5`;
            case 6: return `${baseClasses} lg:grid-cols-6`;
            case 7: return `${baseClasses} lg:grid-cols-7`;
            case 8: return `${baseClasses} lg:grid-cols-8`;
            case 9: return `${baseClasses} lg:grid-cols-9`;
            case 10: return `${baseClasses} lg:grid-cols-10`;
            case 11: return `${baseClasses} lg:grid-cols-11`;
            case 12: return `${baseClasses} lg:grid-cols-12`;
            default: return `${baseClasses} lg:grid-cols-4`;
        }
    }

    // Helper function to get image URL from different formats
    function getImageUrl(img: string | RunStateImage | null): string {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.image_url || '';
    }

    // Function to create a temporary resource from a runState image
    function createTempResource(img: string | RunStateImage): Resource {
        const originalUrl = getImageUrl(img);
        return {
            id: `temp-${crypto.randomUUID()}`,
            image_url: originalUrl, // Use original URL directly for temporary resources
            user_id: user_id || '',
            workflow_name: workflow_name || '',
            created_at: new Date().toISOString(),
            _isTemporary: true,
            _originalUrl: originalUrl // Store the original URL
        };
    }

    // Function to load more images
    function loadMore() {
        displayCount += IMAGES_PER_PAGE;
        
        // If we've displayed all the currently fetched resources, fetch more
        if (displayCount > allResources.length) {
            fetchMoreImages();
        }
    }

    // Helper function to fetch resources from Supabase
    async function fetchResourcesFromSupabase(options) {
        const { offset = 0, limit = IMAGES_PER_PAGE } = options;
        
        if (!user_id) return [];
        
        const wasLoading = isLoading;
        if (!wasLoading) isLoading = true;
        
        try {
            let query = supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .or('visibility.is.null,visibility.eq.true')
                .order('created_at', { ascending: false });
            
            // Filter by workflow names if provided
            if (workflowsToFetch && workflowsToFetch.length > 0) {
                query = query.in('workflow_name', workflowsToFetch);
            }
            
            // Filter by type if provided
            if (typeArray && typeArray.length > 0) {
                query = query.in('type', typeArray);
            }
            
            // Add pagination
            if (offset > 0) {
                query = query.range(offset, offset + limit - 1);
            } else {
                query = query.limit(limit);
            }
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) {
                console.error(`Error fetching resources:`, fetchError);
                return [];
            }
            
            // Store original URLs before transforming
            const resourcesWithOriginalUrls = (data || []).map(resource => ({
                ...resource,
                _originalUrl: resource.image_url // Store the original S3 URL
            }));
            
            // Transform S3 URLs to Bunny.net URLs
            return transformResourceUrls(resourcesWithOriginalUrls);
        } catch (e) {
            console.error('Error in fetchResourcesFromSupabase:', e);
            return [];
        } finally {
            if (!wasLoading) isLoading = false;
        }
    }

    // Function to fetch more images beyond the initial batch
    async function fetchMoreImages() {
        if (!user_id) return;
        
        // Count only permanent resources for offset calculation
        const permanentCount = allResources.filter(r => !r._isTemporary).length;
        const offset = permanentCount;
        
        const additionalResources = await fetchResourcesFromSupabase({ offset });
        
        if (additionalResources.length > 0) {
            // Add new resources to allResources, avoiding duplicates
            mergeResources(additionalResources, false);
        }
        
        // Update hasMoreToLoad flag
        hasMoreToLoad = additionalResources.length === IMAGES_PER_PAGE;
    }

    // Function to merge resources, avoiding duplicates
    function mergeResources(newResources, addToBeginning = true) {
        if (!newResources || newResources.length === 0) return;
        
        // Create maps for faster lookups
        const existingUrlMap = new Map();
        const existingIdMap = new Map();
        const existingOriginalUrlMap = new Map();
        
        // Populate maps
        allResources.forEach(resource => {
            existingUrlMap.set(resource.image_url, resource);
            existingIdMap.set(resource.id, resource);
            if (resource._originalUrl) {
                existingOriginalUrlMap.set(resource._originalUrl, resource);
            }
        });
        
        // Filter out duplicates and update existing resources
        const uniqueNewResources = [];
        const updatedResources = [...allResources];
        
        for (const newResource of newResources) {
            // Check if we already have this resource by ID
            if (existingIdMap.has(newResource.id)) {
                // Update the existing resource
                const index = updatedResources.findIndex(r => r.id === newResource.id);
                if (index >= 0) {
                    updatedResources[index] = newResource;
                }
                continue;
            }
            
            // Check if we have a temporary version of this resource by original URL
            if (newResource._originalUrl) {
                const existingTemp = existingOriginalUrlMap.get(newResource._originalUrl) || 
                                    existingUrlMap.get(newResource._originalUrl);
                
                if (existingTemp && existingTemp._isTemporary) {
                    // Replace the temporary resource with the permanent one
                    const index = updatedResources.findIndex(r => r.id === existingTemp.id);
                    if (index >= 0) {
                        updatedResources[index] = newResource;
                    }
                    continue;
                }
            }
            
            // If it's a new unique resource, add it to our list
            if (!existingUrlMap.has(newResource.image_url) && 
                !existingOriginalUrlMap.has(newResource._originalUrl || '')) {
                uniqueNewResources.push(newResource);
                existingUrlMap.set(newResource.image_url, newResource);
                if (newResource._originalUrl) {
                    existingOriginalUrlMap.set(newResource._originalUrl, newResource);
                }
            }
        }
        
        // Add unique new resources
        if (uniqueNewResources.length > 0) {
            if (addToBeginning) {
                allResources = [...uniqueNewResources, ...updatedResources];
            } else {
                allResources = [...updatedResources, ...uniqueNewResources];
            }
        } else if (updatedResources !== allResources) {
            // If we only updated existing resources
            allResources = updatedResources;
        }
    }

    // Function to sync temporary resources with database
    async function syncTemporaryResources() {
        if (!user_id) return;
        
        // Only sync if we have temporary resources
        const tempResources = allResources.filter(r => r._isTemporary);
        if (tempResources.length === 0) return;
        
        // Get all image URLs we need to check
        const tempUrls = tempResources.map(r => r._originalUrl || r.image_url);
        
        try {
            // Fetch resources that match our temporary URLs
            const { data, error } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .in('image_url', tempUrls);
                
            if (error) {
                console.error('Error syncing temporary resources:', error);
                return;
            }
            
            if (data && data.length > 0) {
                // Store original URLs before transforming
                const resourcesWithOriginalUrls = data.map(resource => ({
                    ...resource,
                    _originalUrl: resource.image_url // Store the original S3 URL
                }));
                
                // Transform the URLs
                const transformedResources = transformResourceUrls(resourcesWithOriginalUrls);
                
                // Replace temporary resources with permanent ones
                mergeResources(transformedResources, false);
            }
        } catch (e) {
            console.error('Error in syncTemporaryResources:', e);
        }
        
        // Update last sync time
        lastSyncTime = Date.now();
    }

    // Initial fetch of user images
    async function fetchUserImages() {
        if (!user_id) return;
        
        const fetchedResources = await fetchResourcesFromSupabase({});
        
        // Merge with any existing temporary resources
        if (fetchedResources.length > 0) {
            mergeResources(fetchedResources, false);
        }
        
        // Start periodic sync for temporary resources
        startPeriodicSync();
    }

    // Start periodic sync for temporary resources
    function startPeriodicSync() {
        // Clear any existing timer
        if (syncTimer) {
            clearInterval(syncTimer);
        }
        
        // Set up new timer
        syncTimer = setInterval(() => {
            // Only sync if we have temporary resources
            const hasTempResources = allResources.some(r => r._isTemporary);
            if (hasTempResources) {
                syncTemporaryResources();
            } else {
                // If no temporary resources, clear the timer
                clearInterval(syncTimer);
                syncTimer = null;
            }
        }, SYNC_INTERVAL);
    }

    // Handle new runState images
    $: if ($runState.images?.length) {
        // Create temporary resources for new images
        const newTempResources = $runState.images
            .map(img => createTempResource(img));
        
        // Merge with existing resources
        mergeResources(newTempResources, true);
        
        // Ensure sync timer is running
        if (!syncTimer) {
            startPeriodicSync();
        }
    }

    // Setup subscription for real-time updates
    function setupSubscription() {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }

        if (user_id) {
            subscription = supabase
                .channel(`resource_changes_${user_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id}`
                    },
                    (payload) => {
                        // Handle different types of changes
                        if (payload.eventType === 'INSERT') {
                            handleResourceInserted(payload.new);
                        } else if (payload.eventType === 'DELETE') {
                            handleResourceDeleted(payload.old);
                        } else if (payload.eventType === 'UPDATE') {
                            handleResourceUpdated(payload.new);
                        }
                    }
                )
                .subscribe();
        }
    }
    
    // Handle new resource inserted
    function handleResourceInserted(newResource) {
        // Check if this resource matches our filters
        if (shouldIncludeResource(newResource)) {
            // Store original URL before transforming
            const resourceWithOriginalUrl = {
                ...newResource,
                _originalUrl: newResource.image_url
            };
            
            // Transform the URL
            const transformedResource = transformResourceUrls([resourceWithOriginalUrl])[0];
            
            // Merge with existing resources
            mergeResources([transformedResource], true);
        }
    }
    
    // Handle resource deleted
    function handleResourceDeleted(oldResource) {
        // Remove the resource from our array
        allResources = allResources.filter(r => r.id !== oldResource.id);
    }
    
    // Handle resource updated
    function handleResourceUpdated(updatedResource) {
        // Check if this resource matches our filters
        if (shouldIncludeResource(updatedResource)) {
            // Store original URL before transforming
            const resourceWithOriginalUrl = {
                ...updatedResource,
                _originalUrl: updatedResource.image_url
            };
            
            // Transform the URL
            const transformedResource = transformResourceUrls([resourceWithOriginalUrl])[0];
            
            // Update the resource
            const index = allResources.findIndex(r => r.id === transformedResource.id);
            
            if (index >= 0) {
                allResources[index] = transformedResource;
                allResources = [...allResources]; // Trigger reactivity
            }
        } else {
            // If it no longer matches our filters, remove it
            allResources = allResources.filter(r => r.id !== updatedResource.id);
        }
    }
    
    // Helper to check if a resource matches our filters
    function shouldIncludeResource(resource) {
        // Check workflow filter
        if (workflowsToFetch && workflowsToFetch.length > 0) {
            if (!workflowsToFetch.includes(resource.workflow_name)) {
                return false;
            }
        }
        
        // Check type filter
        if (typeArray && typeArray.length > 0) {
            if (!typeArray.includes(resource.type)) {
                return false;
            }
        }
        
        return true;
    }

    // Clean up subscription and sync timer when component is destroyed
    onDestroy(() => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
        
        if (syncTimer) {
            clearInterval(syncTimer);
            syncTimer = null;
        }
    });

    // Handle image deletion
    function handleImageDeleted(event) {
        const { id } = event.detail;
        allResources = allResources.filter(r => r.id !== id);
    }

    // Initialize component
    let initialLoadComplete = false;
    $: {
        if (user_id && !initialLoadComplete) {
            // Show any runState images immediately
            if ($runState.images?.length) {
                const tempImages = $runState.images.map(img => createTempResource(img));
                allResources = tempImages;
            }
            
            // Setup subscription for real-time updates
            setupSubscription();
            
            // Fetch images from Supabase
            fetchUserImages();
            
            initialLoadComplete = true;
        }
    }
    
    // Function to handle preview for temporary images
    function handleTempPreview(imageUrl) {
        // Create a custom event that mimics the one from LimnGalleryImageItem
        const previewEvent = new CustomEvent('preview', {
            detail: { imageUrl }
        });
        
        // Dispatch the event
        window.dispatchEvent(previewEvent);
    }
</script>

{#if error}
    <p class="text-red-400 p-4">{error}</p>
{:else}
    <div class="grid gap-1 {gridClass}">
        {#if displayedResources.length > 0}
            {#each displayedResources as resource (resource.id)}
                {#if resource._isTemporary}
                    <!-- Temporary resource with basic interactions - use original S3 URL -->
                    <div class="aspect-square overflow-hidden relative group">
                        <img 
                            src={resource._originalUrl || resource.image_url}
                            alt="Generated image" 
                            class="w-full h-full object-cover"
                            loading="lazy"
                        />
                        
                        <!-- Overlay with basic interactions -->
                        <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-1">
                                <button
                                    class="bg-white text-black rounded-md flex items-center justify-center text-sm hover:bg-gray-200 shadow-md"
                                    on:click={() => handleTempPreview(resource._originalUrl || resource.image_url)}
                                    title="Preview"
                                >
                                    🔍
                                </button>
                                
                                <!-- Other buttons are disabled for temporary resources -->
                                <div class="bg-gray-300 text-gray-500 rounded-md flex items-center justify-center text-sm shadow-md opacity-50">
                                    ℹ️
                                </div>
                                <div class="bg-gray-300 text-gray-500 rounded-md flex items-center justify-center text-sm shadow-md opacity-50">
                                    🎞️
                                </div>
                                <div class="bg-gray-300 text-gray-500 rounded-md flex items-center justify-center text-sm shadow-md opacity-50">
                                    ☀️
                                </div>
                                <div class="bg-gray-300 text-gray-500 rounded-md flex items-center justify-center text-sm shadow-md opacity-50">
                                    🗑️
                                </div>
                            </div>
                        </div>
                        
                        <!-- New badge - only shown for temporary resources -->
                        <div class="absolute top-0 left-0 bg-amber-500 text-white px-2 py-0.5 font-medium">
                            New
                        </div>
                    </div>
                {:else}
                    <!-- Full functionality for permanent resources - use CDN URL -->
                    <LimnGalleryImageItem 
                        {resource} 
                        on:imageDeleted={handleImageDeleted}
                    />
                {/if}
            {/each}
        {:else if allResources.length === 0}
            <div class="col-span-full min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                <p class="text-gray-500 text-lg">No images found in your account</p>
            </div>
        {:else}
            <div class="col-span-full min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                <p class="text-gray-500 text-lg">No images to display</p>
            </div>
        {/if}
    </div>
    
    <!-- Load More button -->
    {#if displayedResources.length > 0 && hasMoreToLoad}
        <div class="mt-4 flex justify-center">
            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md"
                on:click={loadMore}
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Load More'}
            </button>
        </div>
    {/if}
{/if}
