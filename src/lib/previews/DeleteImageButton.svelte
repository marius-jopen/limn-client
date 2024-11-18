<script>
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    const dispatch = createEventDispatcher();
    
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    
    export let image;

    async function handleDelete() {
        try {
            const userId = $user?.id;
            const relativePath = image.replace(serverUrl + '/output', '');
            const deleteUrl = `${serverUrl}/output${relativePath}?userId=${userId}`;
            
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