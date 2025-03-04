<script lang="ts">
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    
    interface Resource {
        id: string;
        user_id: string;
        workflow_name: string;
        batch_name: string | null;
        name: string | null;
        image_url: string;
    }
    
    let resource: Resource | null = null;
    let error: string | null = null;
    
    async function fetchImage() {
        try {
            const { data: imageData, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('id', $runState.imageId)
                .single();
                
            if (supabaseError) throw supabaseError;
            resource = imageData;
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

<div class="max-w-4xl mx-auto p-4">
    {#if error}
        <p class="text-red-400">{error}</p>
    {:else if resource}
        <div class="space-y-4">
            <div class="relative aspect-auto max-h-[80vh]">
                <img 
                    src={resource.image_url} 
                    alt={resource.name || 'Image'} 
                    class="max-w-full max-h-[80vh] object-contain mx-auto"
                />
            </div>
            
            <div class="space-y-2">
                {#if resource.name}
                    <p class="text-lg font-medium">Name: {resource.name}</p>
                {/if}

                {#if resource.batch_name}
                    <p>Batch: {resource.batch_name}</p>
                {/if}

                <p>Workflow: {resource.workflow_name}</p>
            </div>
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div> 