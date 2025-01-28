<script>
    import { user } from '../stores/auth';
    import { supabase } from '../supabase/supabaseClient';
    import { onDestroy } from 'svelte';
    
    export let service;
    
    let resources = [];
    let error = null;

    $: user_id = $user?.id;

    async function fetchUserImages() {
        try {
            const { data, error: supabaseError } = await supabase
                .from('resource')
                .select('*')
                .eq('user_id', user_id)
                .eq('service', service);

            if (supabaseError) throw supabaseError;
            resources = data;
        } catch (e) {
            error = e.message;
            console.error('Error fetching images:', e);
        }
    }

    let subscription;

    function setupSubscription() {
        // Clean up existing subscription if it exists
        if (subscription) {
            subscription.unsubscribe();
        }

        if (user_id) {
            subscription = supabase
                .channel('resource_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'resource',
                        filter: `user_id=eq.${user_id} AND service=eq.${service}`
                    },
                    () => {
                        fetchUserImages();
                    }
                )
                .subscribe();
        }
    }

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        if (subscription) {
            subscription.unsubscribe();
        }
    });

    // Setup subscription and fetch images when user_id or service changes
    $: {
        if (user_id && service) {
            setupSubscription();
            fetchUserImages();
        }
    }
</script>

{#if error}
    <p class="text-red-500 p-4">{error}</p>
{:else}
    <div class="px-4 pb-4">
        <div class="flex flex-col gap-4 border border-gray-300 rounded-lg p-4">
            <h2>
                All Images from {service}
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
