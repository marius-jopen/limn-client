<script lang="ts">
    import { supabase } from '$lib/supabase/supabaseClient';
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

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
        <img 
            class="mx-auto h-10 w-auto" 
            src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600" 
            alt="Your Company"
        >
        <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
            Create your account
        </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form class="space-y-6" on:submit|preventDefault={handleSignUp}>
            <div>
                <label 
                    for="email" 
                    class="block text-sm/6 font-medium text-gray-900"
                >
                    Email address
                </label>
                <div class="mt-2">
                    <input 
                        id="email" 
                        type="email" 
                        bind:value={email}
                        autocomplete="email" 
                        required 
                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                </div>
            </div>

            <div>
                <label 
                    for="password" 
                    class="block text-sm/6 font-medium text-gray-900"
                >
                    Password
                </label>
                <div class="mt-2">
                    <input 
                        id="password" 
                        type="password" 
                        bind:value={password}
                        autocomplete="new-password" 
                        required 
                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                </div>
            </div>

            {#if error}
                <p class="text-red-600 text-sm/6">{error}</p>
            {/if}

            <button 
                type="submit" 
                disabled={loading}
                class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
                {loading ? 'Loading...' : 'Sign Up'}
            </button>
        </form>

        <p class="mt-10 text-center text-sm/6 text-gray-500">
            Already have an account?
            <a href="/auth/signin" class="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in
            </a>
        </p>
    </div>
</div>