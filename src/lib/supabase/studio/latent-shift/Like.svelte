<script>
  import { supabase } from '$lib/supabase/helper/SupabaseClient';
  import { user } from '$lib/supabase/helper/StoreSupabase';
  
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  export let resourceId;
  export let initialLiked = false;

  let isLiked = initialLiked;
  let isLoading = false;

  // Get user ID from store
  $: userId = $user?.id;

  async function handleLike() {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      console.log('Like button clicked for resource:', resourceId);
      isLoading = true;

      const url = `${serverUrl}/resources/${resourceId}/like`;
      console.log('Sending request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for auth
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const { data } = await response.json();
      console.log('Response data:', data);
      isLiked = data[0].liked;

    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      isLoading = false;
    }
  }

  // Handle keyboard events for accessibility
  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLike();
    }
  }
</script>

<button 
  on:click={handleLike}
  on:keydown={handleKeydown}
  disabled={isLoading}
  class="like-button secondary"
  class:liked={isLiked}
  aria-label={isLiked ? "Unlike image" : "Like image"}
  aria-pressed={isLiked}
>
  {#if isLiked}
    ❤️
  {:else}
    🤍
  {/if}
</button>

<style>
  .like-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 8px;
    transition: transform 0.2s;
  }

  .like-button:hover {
    transform: scale(1.1);
  }

  .like-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .like-button.secondary {
    background-color: var(--color-neutral-100);
    border-radius: 0.375rem;
  }
</style>
