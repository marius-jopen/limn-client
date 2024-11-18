<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import Header from '$lib/layout/header.svelte';

    let email = '';
    let password = '';
    let loading = false;
    let error = null;

    async function handleSignIn() {
        try {
            loading = true;
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;
            
            if (data.session) {
                goto('/dashboard');
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="px-8">
    <Header text="Sign In" />

    <form on:submit|preventDefault={handleSignIn}>
        <div class="pb-6">
            <label class="text-xs block pb-2" for="prompt">
                Email
            </label>

            <input 
                class="text-input"
                type="email" 
                id="email" 
                bind:value={email} 
                required
            />
        </div>

        <div class="pb-6">
            <label class="text-xs block pb-2" for="prompt">
                Password
            </label>

            <input 
                class="text-input"
                type="password" 
                id="password" 
                bind:value={password} 
                required
            />
        </div>

        {#if error}
            <p class="error">{error}</p>
        {/if}

        <button class="button" type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Sign In'}
        </button>
    </form>
</div>