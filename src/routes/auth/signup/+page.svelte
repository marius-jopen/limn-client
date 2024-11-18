<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import Header from '$lib/layout/header.svelte';

    let email = '';
    let password = '';
    let loading = false;
    let error = null;

    async function handleSignUp() {
        try {
            loading = true;
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;
            
            if (data.user) {
                goto('/auth/verify-email');
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="px-8">
    <Header text="Sign Up" />

    <form on:submit|preventDefault={handleSignUp}>
        <div class="pb-6">
            <label class="text-xs block pb-2" for="email">
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
            <label class="text-xs block pb-2" for="password">
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
            {loading ? 'Loading...' : 'Sign Up'}
        </button>
    </form> 
</div>