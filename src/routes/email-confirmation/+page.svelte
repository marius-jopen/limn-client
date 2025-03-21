<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import Button from '$lib/atoms/Button.svelte';
    
    // Get the email from the URL query parameter
    $: email = $page.url.searchParams.get('email') || '';
    
    // Navigation functions
    function goToLogin() {
        goto('/login');
    }
    
    function goToRegister() {
        goto('/register');
    }
</script>

<div class="flex flex-col justify-center items-center h-screen">
    <div class="mx-auto w-4/12 rounded-xxl bg-white p-12 text-center">
        <h1 class="text-2xl font-medium w-full text-center pb-6">
            Check Your Email
        </h1>
        
        <div class="mb-8">
            <p class="mb-4">We've sent a confirmation email to:</p>
            <p class="font-semibold mb-6">{email}</p>
            <p>Please click the link in the email to verify your account.</p>
        </div>
        
        <div class="space-y-4">
            <Button
                onClick={goToLogin}
                label="Go to Login"
                variant="primary"
                fullWidth={true}
            />
            
            <p class="text-sm text-neutral-600">
                Didn't receive the email? Check your spam folder or
                <button 
                    on:click={goToRegister}
                    class="underline hover:text-neutral-800"
                >
                    try again
                </button>.
            </p>
        </div>
    </div>
</div>