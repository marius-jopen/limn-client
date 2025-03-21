<script lang="ts">
    import { goto } from '$app/navigation';
    import type { AuthError, AuthResponse } from '@supabase/supabase-js';
    import { supabase } from '$lib/supabase/helper/SupabaseClient';
    import { initializeAuth } from '$lib/supabase/helper/StoreSupabase';
    import Button from '$lib/atoms/Button.svelte';
    import InputText from '$lib/atoms/InputText.svelte';
    import { onMount } from 'svelte';
    
    let email: string = '';
    let password: string = '';
    let confirmPassword: string = '';
    let loading: boolean = false;
    let errorMsg: string = '';

    // Check if user is already logged in when component mounts
    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        
        // If session exists, redirect to dashboard
        if (data.session) {
            console.log('User already logged in, redirecting to dashboard');
            goto('/dashboard');
        }
    });

    async function handleRegister(): Promise<void> {
        try {
            loading = true;
            errorMsg = '';

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match");
            }

            const { data, error }: AuthResponse = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        app_source: 'limn'
                    }
                }
            });

            if (error) throw error;

            if (data?.user) {
                // Explicitly create a user_settings record
                // This is a backup in case the trigger doesn't work
                const { error: settingsError } = await supabase
                    .from('user_settings')
                    .upsert({
                        id: data.user.id,
                        app_source: 'limn'
                    });
                
                if (settingsError) {
                    console.error('Error creating user settings:', settingsError);
                }
                
                await initializeAuth(supabase);
                goto('/login');
            }
        } catch (error) {
            if (error instanceof Error) {
                errorMsg = error.message;
            } else if ((error as AuthError).message) {
                errorMsg = (error as AuthError).message;
            } else {
                errorMsg = 'An unexpected error occurred';
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex flex-col justify-center items-center h-screen">
    <div class="mx-auto w-4/12 rounded-xxl bg-white p-12">

        <h1 class="text-2xl font-medium w-full text-center pb-10">
            Register
        </h1>

        <form on:submit|preventDefault={handleRegister} class="space-y-6">
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

            <div>
                <InputText
                    id="confirm-password"
                    bind:value={confirmPassword}
                    placeholder="Confirm your password"
                    type="password"
                />
            </div>
    
            {#if errorMsg}
                <div class="text-red-500 text-sm">{errorMsg}</div>
            {/if}
    
            <Button
                type="submit"
                disabled={loading}
                label={loading ? 'Loading...' : 'Register'}
                variant="primary"
                fullWidth={true}
            />
    
            <div class="text-center">
                <a href="/login" class="block text-sm text-neutral-600 hover:text-neutral-800">
                    Already have an account? Login
                </a>
            </div>
        </form>
    </div>
</div>
