<!--
    ParameterCopyButton Component
    
    This component creates a button that appears when hovering over an image in the gallery.
    It's designed to fetch and copy the generation parameters associated with an image.

    Functionality:
    - Takes an image URL as a prop
    - When clicked, fetches a corresponding .txt file containing the image's parameters
    - The .txt file is expected to be in the same location as the image but with a .txt extension
    - Dispatches a 'parameterSelect' event with the parsed parameters when successful
    - Button is styled to be semi-transparent and only visible on hover (using group-hover)
-->

<script>
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const dispatch = createEventDispatcher();
    
    export let image;

    async function handleImageClick() {
        try {
            const imageName = image.split('/').pop();
            const userId = $user?.id;
            
            const response = await fetch(`${serverUrl}/api/parameters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageName,
                    userId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load parameters: ${response.statusText}`);
            }
            
            const parameters = await response.json();
            dispatch('parameterSelect', { parameters });
        } catch (err) {
            console.error('Error loading parameters:', err);
        }
    }
</script>

<button 
    class="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-md 
           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    on:click={handleImageClick}
>
    Copy Parameters
</button>