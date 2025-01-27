<script>
    import { supabase } from '../supabase/supabaseClient';
    import { onDestroy } from 'svelte';
    
    export let service;
    
    const userId = 'a87ae7bc-6e08-45b7-a464-4f91cb01b1a7';
    let resources = [];
    let error = null;

    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', userId)
                .eq('service', service);

            if (supabaseError) throw supabaseError;
            resources = data;
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

    // Set up real-time subscription
    const subscription = supabase
        .channel('resource_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'resource',
                filter: `user_id=eq.${userId} AND service=eq.${service}`
            },
            () => {
                // Refresh the images when changes occur
                fetchUserImages();
            }
        )
        .subscribe();

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        subscription.unsubscribe();
    });

    // Fetch images when component mounts or service changes
    $: service && fetchUserImages();
</script>

{#if error}
    <p class="text-red-500 p-4">{error}</p>
{:else}
    <div class="px-4 pb-4">
        <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
            <h2>
                All Images
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
                {#each resources as resource}
                    <div class="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <img 
                            src={resource.image_url} 
                            alt={resource.name || 'User uploaded image'} 
                            class="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}
