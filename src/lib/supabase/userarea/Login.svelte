<script lang="ts">
    import { goto } from '$app/navigation';
    import type { AuthError } from '@supabase/supabase-js';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import InputText from '$lib/atoms/InputText.svelte';

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

<div class="flex flex-col justify-center items-center h-screen">
    <div class="mx-auto w-4/12 rounded-xxl bg-white p-12">

        <h1 class="text-2xl font-medium w-full text-center pb-10">
            Login
        </h1>

        <form on:submit|preventDefault={handleLogin} class="space-y-6">
            <div>
                <InputText
                    id="email"
                    bind:value={email}
                    placeholder="Enter your email"
                />
            </div>
    
            <div>
                <InputText
                    id="password"
                    bind:value={password}
                    placeholder="Enter your password"
                    type="password"
                />
            </div>
    
            {#if errorMsg}
                <div class="text-red-500 text-sm">{errorMsg}</div>
            {/if}
    
            <Button
                type="submit"
                disabled={loading}
                label={loading ? 'Loading...' : 'Login'}
                variant="primary"
                fullWidth={true}
            />
    
            <div class="text-center space-y-2">
                <a href="/register" class="block text-sm text-neutral-600 hover:text-neutral-800">
                    Don't have an account? Register
                </a>
                <a href="/reset-password" class="block text-sm text-neutral-600 hover:text-neutral-800">
                    Forgot password?
                </a>
            </div>
        </form>
    </div>
</div>
