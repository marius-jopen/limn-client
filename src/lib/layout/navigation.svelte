<script lang="ts">
    import Logout from '$lib/supabase/userarea/Logout.svelte';
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import NavigationOverlay from './navigation-overlay.svelte';
    import RoundButton from '$lib/atoms/RoundButton.svelte';
    let menuVisible = false;
</script>


{#if $user}
    {#if !menuVisible}
        <RoundButton 
            label="Menu" 
            onClick={() => menuVisible = !menuVisible} 
            customClass="top-3 left-3 z-20 fixed"
        />
    {/if}

    {#if menuVisible}
        <RoundButton 
            label="X" 
            onClick={() => menuVisible = false} 
            customClass="top-3 left-3 z-20 fixed"
        />
    {/if}

    {#if menuVisible}
        <NavigationOverlay />
    {/if}
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
