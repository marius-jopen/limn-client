<script>
    /**
     * DeleteImageButton Component
     * 
     * This component renders a delete button that appears when hovering over an image in the gallery.
     * Key functionality:
     * - Takes an image URL as a prop
     * - Handles image deletion by making a DELETE request to the server
     * - Uses user authentication to ensure proper permissions
     * - Dispatches an 'imageDeleted' event when deletion is successful
     * - Features a semi-transparent button that appears on hover
     */

    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/stores/auth';
    const dispatch = createEventDispatcher();
    
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    
    export let image;

    async function handleDelete() {
        try {
            const userId = $user?.id;
            
            let relativePath = image.replace(serverUrl + '/output/', '');
            relativePath = relativePath.replace(`${userId}/`, '');
            
            const deleteUrl = `${serverUrl}/output/${relativePath}?userId=${userId}`;
            console.log('Attempting to delete:', deleteUrl);
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete image: ${response.statusText}`);
            }

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