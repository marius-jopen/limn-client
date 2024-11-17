<script>
    import "../app.css";
    import Navigation from "$lib/layout/navigation.svelte";
    
    let isAuthenticated = false;
    let password = '';
    
    function checkPassword() {
        // Very simple password check - obviously not secure!
        if (password === 'limn123') {
            isAuthenticated = true;
        }
    }
</script>

{#if isAuthenticated}
    <div>
        <Navigation />
        
        <main class="lg:pl-72">
            <slot></slot>
        </main>
    </div>
{:else}
    <div class="h-screen flex items-center justify-center">
        <div class="p-8 bg-white rounded shadow-md">
            <h1 class="text-xl mb-4">Enter Password</h1>
            <input 
                type="password" 
                bind:value={password}
                class="border p-2 mb-4 w-full"
                placeholder="Password"
            />
            <button 
                on:click={checkPassword}
                class="bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
                Submit
            </button>
        </div>
    </div>
{/if}