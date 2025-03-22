<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import Label from "$lib/atoms/Label.svelte";
    import Button from "$lib/atoms/Button.svelte";
    import { onMount, onDestroy, afterUpdate } from 'svelte';

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
    export let imageId: string = ""; // Allow direct prop for image ID
    export let userId: string = ""; // Add userId for uploads
    export let hidden: boolean = false;
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    interface Resource {
        id: string;
        image_url: string;
        service?: string;        // Added service field
        batch_name?: string;     // Added batch_name field
        batches_connected?: Array<{batch_name: string, id: string}>; // Added batches_connected field
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
            // Update the query to fetch additional fields
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('id, image_url, service, batch_name, batches_connected')
                .eq('id', idToFetch)
                .single();
                
            if (supabaseError) throw supabaseError;
            
            console.log('Image data fetched:', imageData);
            resource = imageData;
            value = imageData.image_url; // Set the output value
            
            // Process lineage for Deforum images
            if (imageData.service === 'deforum') {
                processImageLineage(imageData);
            } else {
                // Clear any lineage data if not a Deforum image
                runState.update(state => ({
                    ...state,
                    connectedBatches: []
                }));
            }
        } catch (e) {
            error = e.message;
            console.error('Error fetching image:', e);
        }
    }
    
    // Function to process the image lineage
    function processImageLineage(imageData: Resource) {
        if (!imageData.id || !imageData.batch_name) {
            console.warn('Image is missing ID or batch_name, cannot process lineage');
            return;
        }
        
        let lineageArray = [];
        
        // If the image has existing lineage, use it as the base
        if (imageData.batches_connected && Array.isArray(imageData.batches_connected) && imageData.batches_connected.length > 0) {
            lineageArray = [...imageData.batches_connected];
            console.log('Found existing lineage:', lineageArray);
        }
        
        // Add the current image to the lineage
        lineageArray.push({
            batch_name: imageData.batch_name,
            id: imageData.id
        });
        
        console.log('Final lineage array:', lineageArray);
        
        // Update the runState store with the lineage information
        runState.update(state => ({
            ...state,
            connectedBatches: lineageArray
        }));
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
        
        // Clear the lineage data in the store
        runState.update(state => ({
            ...state,
            connectedBatches: []
        }));
        
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
            
            const response = await fetch(serverUrl + '/s3-upload', {
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
            
            const response = await fetch(serverUrl + '/s3-upload', {
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
        <div class="relative w-full h-[500px] mt-2 flex justify-center">
            <div class="relative inline-block animate-fade-in group">
                <img 
                    src={resource.image_url} 
                    alt="Selected image" 
                    class="rounded-md shadow-sm max-h-[500px] object-contain opacity-0 animate-fade-in hover:cursor-pointer"
                />
                
                <div class="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={clearImage}
                        label="Remove"
                        classes="shadow-lg"
                    />
                </div>
            </div>
        </div>
    {:else if preview}
        <div class="relative w-[500px] h-[500px] mt-2 flex justify-center">
            <div class="relative inline-block group">
                <img 
                    src={preview} 
                    alt="Upload preview" 
                    class="rounded-md shadow-sm max-h-[500px] object-contain opacity-0 animate-fade-in hover:cursor-pointer"
                />
                <div class="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            preview = null;
                            value = '';
                            status = 'Ready';
                        }}
                        label="Remove"
                        classes="shadow-lg"
                    />
                </div>
            </div>
        </div>
    {:else if effectiveId}
        <p>Loading image...</p>
    {:else}
        <div 
            class="w-[500px] h-[500px] bg-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors {isDragging ? 'border-blue-500 bg-gray-200' : 'border-gray-200'} relative"
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
            
            <div class="text-4xl mb-4 pointer-events-none">
                {uploading ? '⏳' : '🚀'}
            </div>
            
            {#if !uploading}
                <p class="text-gray-700 text-center text-xl font-light pointer-events-none mb-3">
                    Start here.
                </p>
                <p class="text-gray-500 text-center pointer-events-none">
                    Drop an image here or click to upload
                </p>
                <p class="text-gray-500 text-center pointer-events-none">
                    Or explore our gallery for inspiration below
                </p>
            {:else}
                <p class="text-gray-700 text-center text-xl font-light pointer-events-none mb-2">
                    Just a moment...
                </p>
                <div class="bg-white/70 rounded-full px-4 py-2 mt-2 pointer-events-none">
                    <span class={status === 'Upload successful!' ? 'text-green-500' : 
                          status === 'Upload failed' ? 'text-red-500' : 
                          'text-blue-500'}>
                        {status}
                    </span>
                </div>
            {/if}
            
            {#if !uploading && status !== 'Ready'}
                <div class="absolute bottom-4 text-xs pointer-events-none">
                    <span class={status === 'Upload successful!' ? 'text-green-500' : 
                          status === 'Upload failed' ? 'text-red-500' : 
                          'text-blue-500'}>
                        {status}
                    </span>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .animate-fade-in {
        animation: fade-in 0.5s ease-in-out forwards;
    }
</style> 