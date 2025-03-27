<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import Label from "$lib/atoms/Label.svelte";
    import Button from "$lib/atoms/Button.svelte";
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import { createEventDispatcher } from 'svelte';

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
    
    const dispatch = createEventDispatcher();
    
    async function fetchImage(idToFetch: string, preserveLineage: boolean = false) {
        if (!idToFetch) return;
        
        console.log(`Fetching image with ID: ${idToFetch}, preserveLineage: ${preserveLineage}`);
        
        try {
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('id, image_url, service, batch_name, batches_connected')
                .eq('id', idToFetch)
                .single();
                
            if (supabaseError) throw supabaseError;
            
            console.log('Image data fetched:', imageData);
            resource = imageData;
            value = imageData.image_url;
            
            // Only process lineage if we're preserving it or it's a new Deforum image
            if (preserveLineage || imageData.service === 'deforum') {
                processImageLineage(imageData, preserveLineage);
            } else {
                // Clear lineage only if we're not preserving it
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
    function processImageLineage(imageData: Resource, preserveLineage: boolean = false) {
        if (!imageData.id || !imageData.batch_name) {
            console.warn('Image is missing ID or batch_name, cannot process lineage');
            return;
        }
        
        let lineageArray = [];
        
        // If we're preserving lineage, keep the existing connected batches
        if (preserveLineage && $runState?.connectedBatches) {
            lineageArray = [...$runState.connectedBatches];
        }
        // Otherwise, use the image's own batches_connected if available
        else if (imageData.batches_connected && Array.isArray(imageData.batches_connected)) {
            lineageArray = [...imageData.batches_connected];
        }
        
        // Add the current image to the lineage if it's not already the last item
        const lastBatch = lineageArray[lineageArray.length - 1];
        if (!lastBatch || lastBatch.id !== imageData.id) {
            lineageArray.push({
                batch_name: imageData.batch_name,
                id: imageData.id
            });
        }
        
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

        // Clear the lineage at the start of upload
        runState.update(state => ({
            ...state,
            connectedBatches: []
        }));

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
    
    selectedImageId.subscribe((newId, options = {}) => {
        console.log(`Store update: selectedImageId changed from ${lastStoredId} to ${newId}`);
        lastStoredId = newId;
        if (newId) {
            // Pass the preserve_lineage flag to fetchImage
            fetchImage(newId, options?.preserve_lineage);
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
        event.stopPropagation();
        isDragging = true;
    }
    
    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        // Only set isDragging to false if we actually left the element
        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            isDragging = false;
        }
    }
    
    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;
        
        // Clear the lineage at the start of drop
        runState.update(state => ({
            ...state,
            connectedBatches: []
        }));

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
        
        // Don't clear existing states until we have the new image
        error = null;
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
                // Only now clear the resource and set the new values
                resource = null;
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
        } finally {
            uploading = false;
        }
    }

    // Add hover handlers for the image
    function handleImageHover(isHovering: boolean) {
        dispatch('hover', { isHovering });
    }
</script>

<div class="flex flex-col gap-2 {hidden ? 'hidden' : ''} items-center w-full">    
    {#if error}
        <p class="text-red-400">{error}</p>
    {/if}
    
    <div 
        class="relative w-full min-h-[200px] max-h-[400px] mt-2 flex justify-center"
        on:dragenter={handleDragEnter}
        on:dragleave={handleDragLeave}
        on:dragover={handleDragOver}
        on:drop={handleDrop}
    >
        {#if resource || preview}
            <div class="relative inline-block group max-w-full">
                <img 
                    on:mouseenter={() => dispatch('hover', { isHovering: true, info: "Drop an image here or select one from your gallery to start the animation" })}
                    on:mouseleave={() => dispatch('hover', { isHovering: false })}
                    src={resource ? resource.image_url : preview} 
                    alt="Selected image" 
                    class="rounded-xl shadow-sm max-h-[400px] w-auto max-w-full object-contain opacity-100 transition-opacity duration-300"
                    class:opacity-50={isDragging || uploading}
                />
                
                <div class="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={resource ? clearImage : () => {
                            preview = null;
                            value = '';
                            status = 'Ready';
                        }}
                        label="Remove"
                        classes="shadow-lg"
                    />
                </div>
                
                {#if isDragging}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                        <p class="text-white text-lg font-medium">Drop to replace image</p>
                    </div>
                {/if}
                
                {#if uploading}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                        <p class="text-white text-lg font-medium">{status}</p>
                    </div>
                {/if}
            </div>
        {:else}
            <div 
                class="w-full max-w-[400px] aspect-square bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group relative {isDragging ? 'border-blue-500 bg-gray-200' : 'border-gray-200'}"
                on:mouseenter={() => dispatch('hover', { isHovering: true, info: "Drop an image here or select one from your gallery to start the animation" })}
                on:mouseleave={() => dispatch('hover', { isHovering: false })}
            >
                <input
                    type="file"
                    accept="image/*"
                    on:change={handleFileChange}
                    disabled={uploading}
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div class="text-3xl md:text-4xl smooth-float mb-2">
                    🚀
                </div>
                
                {#if !uploading}
                    <p class="text-gray-700 text-center text-md font-light pointer-events-none mb-3 px-4 sm:px-12">
                        Drop an image here or <br/> remix one of the images from below
                    </p>
                {:else}
                    <p class="text-gray-700 text-center text-md font-light pointer-events-none mb-2">
                        Just a moment...
                    </p>
                    <div class="bg-white/70 rounded-full px-4 py-2 mt-2 pointer-events-none">
                        <span class={status === 'Upload successful!' ? 'text-green-500' : 
                              status === 'Upload failed' ? 'text-red-500' : 
                              'text-gray-600'}>
                            {status}
                        </span>
                    </div>
                {/if}
                
                {#if !uploading && status !== 'Ready'}
                    <div class="absolute bottom-4 text-xs pointer-events-none">
                        <span class={status === 'Upload successful!' ? 'text-green-500' : 
                              status === 'Upload failed' ? 'text-red-500' : 
                              'text-gray-600'}>
                            {status}
                        </span>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .animate-fade-in {
        animation: fade-in 0.5s ease-in-out forwards;
    }

    @keyframes float {
        0% {
            transform: translateY(0) rotate(-2deg);
        }
        25% {
            transform: translateY(-4px) rotate(2deg);
        }
        50% {
            transform: translateY(-8px) rotate(-1deg);
        }
        75% {
            transform: translateY(-4px) rotate(1deg);
        }
        100% {
            transform: translateY(0) rotate(-2deg);
        }
    }

    .smooth-float {
        transition: transform 0.3s ease-in-out;
    }

    .group:hover .smooth-float {
        animation: float 3s ease-in-out infinite;
    }
</style> 