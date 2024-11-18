<script>
    import { createEventDispatcher } from 'svelte';
    
    const SERVER_URL = import.meta.env.SERVER_URL;
    const dispatch = createEventDispatcher();
    
    export let image;

    async function handleImageClick() {
        try {
            const relativePath = image.replace(SERVER_URL + '/output', '');
            const parameterUrl = `${SERVER_URL}/output${relativePath.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '.txt')}`;
            
            const response = await fetch(parameterUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load parameters: ${response.statusText}`);
            }
            
            const textContent = await response.text();
            const parameters = JSON.parse(textContent);

            console.log(parameters);
            
            dispatch('parameterSelect', parameters);
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