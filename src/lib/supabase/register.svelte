<script lang="ts">
    import { supabase } from '../supabase/supabaseClient';
    import { goto } from '$app/navigation';
    import { initializeAuth } from '../stores/auth';

    let email = '';
    let password = '';
    let confirmPassword = '';
    let loading = false;
    let errorMsg = '';

    async function handleRegister() {
        try {
            loading = true;
            errorMsg = '';

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match");
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data) {
                await initializeAuth(supabase);
                goto('/login');
            }
        } catch (error) {
            if (error instanceof Error) {
                errorMsg = error.message;
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-md mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
    <form on:submit|preventDefault={handleRegister} class="space-y-6">
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

        <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
                type="password"
                id="confirm-password"
                bind:value={confirmPassword}
                required
                placeholder="Confirm your password"
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
            {loading ? 'Loading...' : 'Register'}
        </button>

        <div class="text-center">
            <a href="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
                Already have an account? Login
            </a>
        </div>
    </form>
</div>
