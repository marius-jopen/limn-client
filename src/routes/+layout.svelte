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
        <div class="px-8 pt-4 pb-8 bg-white rounded-2xl border border-gray-200">
            <h1 class="text-xl mb-4 text-center pb-2 pt-1">Enter Password</h1>
            <input 
                type="password" 
                bind:value={password}
                class="text-input mr-2"
                placeholder="Password"
            />

            <button 
                on:click={checkPassword}
                class="button"
            >
                Submit
            </button>
        </div>
    </div>
{/if}