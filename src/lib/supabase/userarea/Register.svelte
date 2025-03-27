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
    let registrationCode: string = '';
    let loading: boolean = false;
    let errorMsg: string = '';

    const VALID_REGISTRATION_CODE = 'LIMN2025';

    // Check if user is already logged in when component mounts
    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        
        // Only redirect if we're actually on the register page
        if (data.session && window.location.pathname === '/register') {
            console.log('User already logged in, redirecting from register page to dashboard');
            goto('/dashboard');
        }
    });

    async function handleRegister(): Promise<void> {
        try {
            loading = true;
            errorMsg = '';

            if (registrationCode !== VALID_REGISTRATION_CODE) {
                throw new Error('Invalid registration code');
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match");
            }

            // Register with app_source in metadata - this is important for the trigger
            const { data, error }: AuthResponse = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        app_source: 'limn'  // Put back the metadata to help the trigger
                    }
                }
            });

            if (error) throw error;

            if (data?.user) {
                console.log('User registered successfully with ID:', data.user.id);
                
                // Now try to explicitly create the user_settings
                const { error: settingsError } = await supabase
                    .from('user_settings')
                    .upsert({
                        id: data.user.id,
                        app_source: 'limn'
                    });
                
                if (settingsError) {
                    console.log('Error creating user settings from client (this is expected if RLS blocks it):', settingsError);
                } else {
                    console.log('Successfully created user_settings with app_source="limn"');
                }
                
                // Let's store the app_source in localStorage as an additional fallback
                try {
                    localStorage.setItem('limn_app_source', 'limn');
                    localStorage.setItem('limn_user_id', data.user.id);
                } catch (e) {
                    console.log('Could not store in localStorage:', e);
                }
                
                await initializeAuth(supabase);
                
                // Redirect to confirmation page
                goto('/email-confirmation?email=' + encodeURIComponent(email));
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
    <div class="mx-auto w-11/12 md:w-8/12 lg:w-4/12 rounded-lg md:rounded-xl bg-white pt-10 pb-12 px-8">

        <h1 class="text-2xl font-medium w-full text-center pb-10">
            Register
        </h1>

        <form on:submit|preventDefault={handleRegister} class="space-y-6">
            <div>
                <InputText
                    id="registration-code"
                    bind:value={registrationCode}
                    placeholder="Enter registration code"
                />
            </div>
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
