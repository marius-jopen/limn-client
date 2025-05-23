<script lang="ts">
    import { goto } from '$app/navigation';
    import type { AuthError } from '@supabase/supabase-js';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import InputText from '$lib/atoms/InputText.svelte';
    import { onMount } from 'svelte';

    let email: string = '';
    let password: string = '';
    let loading: boolean = false;
    let errorMsg: string = '';

    // Check if user is already logged in when component mounts
    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        
        // Only redirect if we're actually on the login page
        if (data.session && window.location.pathname === '/login') {
            console.log('User already logged in, redirecting from login page to dashboard');
            goto('/dashboard');
        }
    });

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
                
                // Attempt to fix NULL app_source issue
                await fixAppSource(data.user.id);
                
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
    
    // Function to check and fix NULL app_source values
    async function fixAppSource(userId) {
        try {
            // First, check if app_source is NULL
            const { data: settings, error: checkError } = await supabase
                .from('user_settings')
                .select('app_source')
                .eq('id', userId)
                .single();
                
            console.log('Checking user settings:', settings);
            
            // If it's NULL, attempt to fix it
            if (!settings?.app_source) {
                console.log('Found NULL app_source, attempting to fix...');
                
                // Try to set it to 'limn'
                const { error: updateError } = await supabase
                    .from('user_settings')
                    .update({ app_source: 'limn' })
                    .eq('id', userId);
                    
                if (updateError) {
                    console.error('Error fixing app_source:', updateError);
                } else {
                    console.log('Successfully fixed app_source to "limn"');
                }
            }
        } catch (error) {
            console.error('Error in fixAppSource:', error);
        }
    }
</script>

<div class="flex flex-col justify-center items-center h-screen">
    <div class="mx-auto w-11/12 md:w-8/12 lg:w-4/12 rounded-lg md:rounded-xl bg-white pt-10 pb-12 px-8">

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
