<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    const SERVER_URL = import.meta.env.SERVER_URL || 'http://localhost:4000/api';
    
    export let image;

    async function handleDelete() {
        try {
            const relativePath = image.replace(SERVER_URL + '/output', '');
            const deleteUrl = `${SERVER_URL}/output${relativePath}`;
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete image: ${response.statusText}`);
            }

            // Dispatch event after successful deletion
            dispatch('imageDeleted', { image });
        } catch (err) {
            console.error('Error deleting image:', err);
        }
    }
</script>

<button 
    class="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-md 
           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    on:click={handleDelete}
>
    Delete
</button>