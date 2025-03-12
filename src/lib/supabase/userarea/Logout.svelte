<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/helper/SupabaseClient';
  import Button from '$lib/atoms/Button.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  async function handleLogout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      dispatch('logout');
      await goto('/'); // Redirect to home page after successful logout
    }
  }
</script>

<Button 
    label="Logout" 
    onClick={handleLogout}
    variant="secondary"
    size="sm"
/>