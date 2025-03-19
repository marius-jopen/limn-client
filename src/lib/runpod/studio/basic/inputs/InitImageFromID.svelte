<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import Label from "$lib/atoms/Label.svelte";
    import { onMount, onDestroy, afterUpdate } from 'svelte';

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
    export let imageId: string = ""; // Allow direct prop for image ID
    export let userId: string = ""; // Add userId for uploads
    
    interface Resource {
        id: string;
        image_url: string;
    }
    
    let resource: Resource | null = null;
    let error: string | null = null;
    
    // Upload-related states
    let uploading = false;
    let preview: string | null = null;
    let status: string = 'Ready';
    
    async function fetchImage(idToFetch: string) {
        if (!idToFetch) return;
        
        console.log(`Fetching image with ID: ${idToFetch}`);
        
        try {
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('id, image_url')
                .eq('id', idToFetch)
                .single();
                
            if (supabaseError) throw supabaseError;
            
            console.log('Image data fetched:', imageData);
            resource = imageData;
            value = imageData.image_url; // Set the output value
        } catch (e) {
            error = e.message;
            console.error('Error fetching image:', e);
        }
    }
    
    // Function to clear the selected image
    function clearImage() {
        resource = null;
        value = "";
        preview = null;
        
        // If we're using the selectedImageId store, clear it
        if ($selectedImageId) {
            selectedImageId.set(null);
        }
        
        // If runState has an imageId, we can't directly modify it
        // but we can at least clear our local state
        
        console.log("Image selection cleared");
    }

    // Upload functionality
    async function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;

        if (!userId) {
            error = "No userId provided for upload";
            status = "Upload failed";
            console.error("Upload attempted without userId");
            return;
        }

        // Reset previous state
        value = '';
        preview = null;
        error = null;
        
        console.log('Starting upload with:', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            userId: userId
        });

        status = 'Starting upload...';
        uploading = true;

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', userId);

            status = 'Sending to server...';
            
            const response = await fetch('http://localhost:4000/api/s3-upload', {
                method: 'POST',
                body: formData
            });

            console.log('Server response status:', response.status);
            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Invalid JSON response from server');
            }
            
            if (data.success && data.url) {
                value = data.url;
                preview = data.url;
                status = 'Upload successful!';
                console.log('Upload completed:', data.url);
            } else {
                throw new Error(data.error || 'Upload failed without error message');
            }

        } catch (err) {
            console.error('Upload error:', err);
            error = err instanceof Error ? err.message : 'Upload failed';
            status = 'Upload failed';
            // Clear any old values
            value = '';
            preview = null;
        } finally {
            uploading = false;
        }
    }
    
    // Handle direct prop changes separately with a watcher
    $: if (imageId && imageId !== lastPropId) {
        lastPropId = imageId;
        fetchImage(imageId);
    }
    let lastPropId = "";
    
    // Force a refresh whenever selectedImageId changes
    let lastStoredId = $selectedImageId;
    
    selectedImageId.subscribe(newId => {
        console.log(`Store update: selectedImageId changed from ${lastStoredId} to ${newId}`);
        lastStoredId = newId;
        if (newId) {
            // Directly trigger fetch when store changes
            fetchImage(newId);
        }
    });
    
    // Make runState more prominent and enhance the reactivity
    $: console.log('runState.imageId changed:', $runState?.imageId);
    
    // Define effectiveId for the template
    $: effectiveId = imageId || $selectedImageId || $runState?.imageId;
    
    // Keep track of if runState has been processed
    let initialRunStateProcessed = false;
    
    // Add an afterUpdate hook to ensure we fetch after component updates
    afterUpdate(() => {
        const stateImageId = $runState?.imageId;
        if (stateImageId && !initialRunStateProcessed) {
            console.log('afterUpdate: Fetching image from runState:', stateImageId);
            initialRunStateProcessed = true;
            fetchImage(stateImageId);
        }
    });
    
    // Add a more aggressive subscription to runState
    const unsubscribeRunState = runState.subscribe(state => {
        if (state?.imageId) {
            console.log('Direct runState subscription in InitImageFromID:', state.imageId);
            // Don't set initialRunStateProcessed here to allow afterUpdate to run too
            fetchImage(state.imageId);
        }
    });
    
    onDestroy(() => {
        if (unsubscribeRunState) unsubscribeRunState();
    });
    
    // Remove the DeforumRun imageId prop since it's not supported
    
    // Add more logging to track state
    $: console.log('Current state:', { 
        imageId, 
        selectedImageId: $selectedImageId, 
        runStateImageId: $runState?.imageId,
        effectiveId,
        resource: resource?.id
    });
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    
    {#if error}
        <p class="text-red-400">{error}</p>
    {:else if resource}
        <div class="relative w-full max-w-md mt-2">
            <img 
                src={resource.image_url} 
                alt="Selected image" 
                class="rounded-md shadow-sm max-h-48 object-contain"
            />
            
            <!-- Add clear button -->
            <button 
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600"
                on:click={clearImage}
                title="Remove image"
                type="button"
            >
                ✕
            </button>
        </div>
        <div class="text-sm text-gray-500 break-all">
            Image URL: {value}
        </div>
    {:else if preview}
        <!-- Show the uploaded image preview -->
        <div class="relative w-full max-w-md mt-2">
            <img 
                src={preview} 
                alt="Upload preview" 
                class="rounded-md shadow-sm max-h-48 object-contain"
            />
            <button
                on:click={() => {
                    preview = null;
                    value = '';
                    status = 'Ready';
                }}
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                type="button"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="text-sm text-gray-500 break-all">
            Uploaded URL: {value}
        </div>
    {:else if effectiveId}
        <p>Loading image...</p>
    {:else}
        <!-- Add upload functionality when no image is selected -->
        <div class="text-sm mb-2">
            Status: <span class={status === 'Upload successful!' ? 'text-green-500' : 
                          status === 'Upload failed' ? 'text-red-500' : 
                          'text-blue-500'}>{status}</span>
        </div>

        <div class="relative">
            <input
                type="file"
                accept="image/*"
                on:change={handleFileChange}
                disabled={uploading}
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="flex items-center justify-center w-full h-10 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Choose image
            </div>
        </div>
        
        {#if uploading}
            <div class="text-sm text-blue-500 flex items-center">
                <svg class="animate-spin h-5 w-5 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {status}
            </div>
        {/if}
    {/if}
</div> 