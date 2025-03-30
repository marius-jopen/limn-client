<script>
  import { supabase } from '$lib/supabase/helper/SupabaseClient';
  import { user } from '$lib/supabase/helper/StoreSupabase';
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/atoms/Button.svelte';
  
  const dispatch = createEventDispatcher();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  export let resourceId;
  export let initialLiked = false;

  let isLiked = initialLiked;
  let isLoading = false;
  let isHovered = false;

  // Get user ID from store
  $: userId = $user?.id;

  let buttonElement;
  
  $: if (buttonElement) {
    buttonElement.addEventListener('mouseenter', () => isHovered = true);
    buttonElement.addEventListener('mouseleave', () => isHovered = false);
  }

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
      
      // Dispatch event with new like state
      dispatch('likeChanged', {
        resourceId,
        liked: isLiked
      });

    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      isLoading = false;
    }
  }

  // Update local state when initialLiked prop changes
  $: {
    isLiked = initialLiked;
  }

  // Handle keyboard events for accessibility
  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLike();
    }
  }
</script>

<Button
  variant="secondary"
  size="sm"
  onClick={handleLike}
  on:keydown={handleKeydown}
  disabled={isLoading}
  aria-label={isLiked ? "Unlike image" : "Like image"}
  aria-pressed={isLiked}
>
  <span class="heart" class:liked={isLiked}>❤️</span>
</Button>

<style>
  .heart {
    display: inline-block;
    filter: grayscale(1);
    transition: filter 0.2s ease;
  }

  .heart.liked {
    filter: none;
  }

  /* Target the button element and its hover state */
  :global(button:hover) .heart {
    filter: none;
  }
</style>
