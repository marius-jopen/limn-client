<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import { selectedImageId } from '$lib/supabase/helper/StoreSupabase';
    import Label from "$lib/atoms/Label.svelte";

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
    export let imageId: string = ""; // Allow direct prop for image ID
    
    interface Resource {
        id: string;
        image_url: string;
    }
    
    let resource: Resource | null = null;
    let error: string | null = null;
    
    async function fetchImage(idToFetch: string) {
        if (!idToFetch) return;
        
        try {
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('id, image_url')
                .eq('id', idToFetch)
                .single();
                
            if (supabaseError) throw supabaseError;
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
        
        // If we're using the selectedImageId store, clear it
        if ($selectedImageId) {
            selectedImageId.set(null);
        }
        
        // If runState has an imageId, we can't directly modify it
        // but we can at least clear our local state
        
        console.log("Image selection cleared");
    }
    
    // Fetch image when the store's imageId or runState imageId changes
    $: effectiveId = imageId || $selectedImageId || $runState?.imageId;
    $: if (effectiveId) {
        fetchImage(effectiveId);
    }
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
    {:else if effectiveId}
        <p>Loading image...</p>
    {:else}
        <p>No image selected</p>
    {/if}
</div> 