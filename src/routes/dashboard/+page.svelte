<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import Header from '$lib/layout/header.svelte';

    let user = null;

    onMount(async () => {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user;
        console.log('User ID:', user?.id);
    });
</script>

<div class="px-8">
    <Header text="Dashboard" />

    {#if user}
        <div class="px-4 sm:px-0">
            <h3 class="text-base/7 font-semibold text-gray-900">User Information</h3>
            <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">Account details and preferences.</p>
        </div>
        <div class="mt-6 border-t border-gray-100">
            <dl class="divide-y divide-gray-100">
                <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-gray-900">Email address</dt>
                    <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{user.email}</dd>
                </div>
                <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-gray-900">User ID</dt>
                    <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{user.id}</dd>
                </div>
            </dl>
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div> 