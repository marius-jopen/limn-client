<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';

    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
            console.log('User is logged in, redirecting to dashboard');
            goto('/dashboard');
        }
    });
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center justify-center">
        <div class="text-4xl md:text-6xl font-bold -mt-10 text-center pb-12">
            🔮 
        </div>
        <div class="text-xl md:text-4xl font-bold -mt-10 text-center">
            Explore the Latent Space
        </div>
    </div>
</div>