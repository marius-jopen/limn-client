<script>
  import { supabase } from './supabaseClient';
  import { goto } from '$app/navigation';

  async function handleLogout() {
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
