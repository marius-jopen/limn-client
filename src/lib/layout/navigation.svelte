<script lang="ts">
    import Logout from '$lib/supabase/userarea/Logout.svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import NavigationOverlay from './navigation-overlay.svelte';
    import Button from '$lib/atoms/Button.svelte';
    import { goto } from '$app/navigation';
    
    let menuVisible = false;
    
    function handleNavigate(event) {
        console.log("Navigation event received in main component:", event.detail.href);
        const href = event.detail.href;
        
        // First navigate to the new route
        goto(href);
        
        // Then close the overlay after a short delay
        setTimeout(() => {
            menuVisible = false;
        }, 300);
    }
</script>


{#if $user}
    <Button 
        label={menuVisible ? "X" : "Menu"} 
        onClick={() => menuVisible = !menuVisible} 
        variant="secondary"
        size="sm"
        fullWidth={false}
        classes="fixed top-3 right-3 z-20"
    />

    <NavigationOverlay 
        isOpen={menuVisible} 
        on:navigate={handleNavigate}
    />

{:else}
    <div class="flex gap-2 top-3 right-3 z-20 fixed">
        <Button 
            label="Register" 
            onClick={() => goto('/register')}
            variant="secondary"
            size="sm"
        />

        <Button 
            label="Login" 
            onClick={() => goto('/login')}
            variant="secondary"
            size="sm"
        />
    </div>
{/if}
        
<!-- <div class="flex justify-between w-full"> 
    <div class="flex gap-4 px-4 py-4">
        <a href="/">Home</a>
        
        {#if $user}
            <a href="/dashboard">Dashboard</a>
            <a href="/studio/comfyui">ComfyUI</a>
            <a href="/studio/comfyui-flux">ComfyUI Flux</a>
            <a href="/studio/a1111">A1111</a>
            <a href="/studio/deforum">Deforum</a>
            <a href="/studio/deforum-limn">Deforum Limn</a>
            <a href="/studio/output">Output</a>
        {/if}
    </div>
    
    <div class="flex gap-4 px-4 py-4">
        {#if $user}
            <Logout />
        {:else}
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        {/if}
    </div>
</div> -->
