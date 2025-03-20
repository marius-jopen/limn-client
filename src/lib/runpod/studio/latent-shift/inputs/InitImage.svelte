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
    export let hidden: boolean = false;
    
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

    // Add drag and drop handling
    let isDragging = false;
    
    function handleDragEnter(event: DragEvent) {
        event.preventDefault();
        isDragging = true;
    }
    
    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
    }
    
    function handleDragOver(event: DragEvent) {
        event.preventDefault(); // Necessary to allow dropping
    }
    
    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
        
        if (!userId) {
            error = "No userId provided for upload";
            status = "Upload failed";
            console.error("Upload attempted without userId");
            return;
        }
        
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            error = "Please drop an image file";
            status = "Upload failed";
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
</script>

<div class="flex flex-col gap-2 {hidden ? 'hidden' : ''} items-center">    
    {#if error}
        <p class="text-red-400">{error}</p>
    {:else if resource}
        <div class="relative w-full h-[500px] mt-2 group flex justify-center">
            <div class="relative inline-block">
                <img 
                    src={resource.image_url} 
                    alt="Selected image" 
                    class="rounded-md shadow-sm max-h-[500px] object-contain"
                />
                
                <!-- Close button positioned on the image itself -->
                <button 
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    on:click={clearImage}
                    title="Remove image"
                    type="button"
                >
                    ✕
                </button>
            </div>
        </div>
    {:else if preview}
        <!-- Show the uploaded image preview -->
        <div class="relative w-[500px] h-[500px] mt-2 group flex justify-center">
            <div class="relative inline-block">
                <img 
                    src={preview} 
                    alt="Upload preview" 
                    class="rounded-md shadow-sm max-h-[500px] object-contain"
                />
                <button
                    on:click={() => {
                        preview = null;
                        value = '';
                        status = 'Ready';
                    }}
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    type="button"
                >
                    ✕
                </button>
            </div>
        </div>
        <div class="text-sm text-gray-500 break-all">
            Uploaded URL: {value}
        </div>
    {:else if effectiveId}
        <p>Loading image...</p>
    {:else}
        <!-- Replace upload button with a gray drag and drop box -->
        <div class="text-sm mb-2 self-start">
            Status: <span class={status === 'Upload successful!' ? 'text-green-500' : 
                          status === 'Upload failed' ? 'text-red-500' : 
                          'text-blue-500'}>{status}</span>
        </div>

        <div 
            class="w-[500px] h-[500px] bg-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-400'}"
            on:dragenter={handleDragEnter}
            on:dragleave={handleDragLeave}
            on:dragover={handleDragOver}
            on:drop={handleDrop}
        >
            <input
                type="file"
                accept="image/*"
                on:change={handleFileChange}
                disabled={uploading}
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            
            <p class="text-gray-600 text-center">
                Drag & drop an image here <br> or click to select
            </p>
        </div>
        
        {#if uploading}
            <div class="text-sm text-blue-500 flex items-center mt-2">
                <svg class="animate-spin h-5 w-5 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {status}
            </div>
        {/if}
    {/if}
</div> 