<script>
    import Logout from '../supabase/logout.svelte';
    import { user } from '../stores/auth';
</script>

<div class="flex justify-between w-full">
    <div class="flex gap-4 px-4 py-4">
        <a href="/">Home</a>
        
        {#if $user}
            <a href="/dashboard">Dashboard</a>
            <a href="/testing/comfyui">ComfyUI</a>
            <a href="/testing/comfyui-flux">ComfyUI Flux</a>
            <a href="/testing/a1111">A1111</a>
            <a href="/testing/deforum">Deforum</a>
            <a href="/testing/output">Output</a>
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
</div>
