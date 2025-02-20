<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/helper/SupabaseClient';

  async function handleLogout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      await goto('/'); // Redirect to home page after successful logout
    }
  }
</script>

<button on:click={handleLogout}>
    Logout
</button>
