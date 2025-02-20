<script lang="ts">
    import { goto } from '$app/navigation';
    import type { AuthError } from '@supabase/supabase-js';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';

    let email: string = '';
    let password: string = '';
    let loading: boolean = false;
    let errorMsg: string = '';

    async function handleLogin(): Promise<void> {
        try {
            loading = true;
            errorMsg = '';
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data) {
                await initializeAuth(supabase);
                goto('/dashboard');
            }
        } catch (error) {
            if (error instanceof Error || (error as AuthError).message) {
                errorMsg = (error as Error | AuthError).message;
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-md mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
    <form on:submit|preventDefault={handleLogin} class="space-y-6">
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="email"
                id="email"
                bind:value={email}
                required
                placeholder="Enter your email"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>

        <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                required
                placeholder="Enter your password"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>

        {#if errorMsg}
            <div class="text-red-500 text-sm">{errorMsg}</div>
        {/if}

        <button
            type="submit"
            disabled={loading}
            class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {loading ? 'Loading...' : 'Login'}
        </button>

        <div class="text-center space-y-2">
            <a href="/register" class="block text-sm text-indigo-600 hover:text-indigo-500">
                Don't have an account? Register
            </a>
            <a href="/reset-password" class="block text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
            </a>
        </div>
    </form>
</div>
