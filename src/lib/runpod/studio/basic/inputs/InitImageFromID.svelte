<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import Label from "$lib/atoms/Label.svelte";

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
    
    interface Resource {
        id: string;
        image_url: string;
    }
    
    let resource: Resource | null = null;
    let error: string | null = null;
    
    async function fetchImage() {
        try {
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('id, image_url')
                .eq('id', $runState.imageId)
                .single();
                
            if (supabaseError) throw supabaseError;
            resource = imageData;
            value = imageData.image_url; // Set the output value
        } catch (e) {
            error = e.message;
            console.error('Error fetching image:', e);
        }
    }
    
    // Fetch image when the store's imageId changes
    $: if ($runState?.imageId) {
        fetchImage();
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
        </div>
        <div class="text-sm text-gray-500 break-all">
            Image URL: {value}
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div> 