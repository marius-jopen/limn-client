<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/helper/SupabaseClient';
  import Button from '$lib/atoms/Button.svelte';
  
  // State variables
  let users = [];
  let loading = false;
  let error = '';
  let success = '';
  let isAdmin = false;
  
  // Check if current user is an admin
  async function checkAdminStatus() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;
      
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
        
      return !!data;
    } catch (e) {
      console.error('Admin check error:', e);
      return false;
    }
  }
  
  // Fetch all users using our database function
  async function fetchUsers() {
    try {
      loading = true;
      error = '';
      
      const { data, error: fetchError } = await supabase.rpc('get_users_with_settings');
      
      if (fetchError) throw fetchError;
      users = data || [];
      console.log('Fetched users:', users);
    } catch (e) {
      error = `Failed to load users: ${e.message}`;
      console.error(e);
    } finally {
      loading = false;
    }
  }
  
  // Update user's app_source
  async function updateUserAppSource(userId, newAppSource) {
    try {
      loading = true;
      error = '';
      success = '';
      
      // Update the user_settings table
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({ 
          id: userId, 
          app_source: newAppSource,
          updated_at: new Date().toISOString() 
        });
      
      if (updateError) throw updateError;
      
      // Also update auth.users metadata (needs to be done with an edge function ideally)
      // But we'll skip this for now as the user_settings table is our primary source
      
      // Update local state
      users = users.map(user => {
        if (user.id === userId) {
          return { ...user, app_source: newAppSource };
        }
        return user;
      });
      
      success = 'User settings updated successfully';
    } catch (e) {
      error = `Failed to update user: ${e.message}`;
      console.error(e);
    } finally {
      loading = false;
      // Refresh the user list
      fetchUsers();
    }
  }
  
  onMount(async () => {
    isAdmin = await checkAdminStatus();
    if (isAdmin) {
      fetchUsers();
    }
  });
</script>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-6">User Management</h1>
  
  {#if !isAdmin}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      You do not have admin privileges to access this page.
    </div>
  {:else if loading && users.length === 0}
    <div class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  {:else if error && users.length === 0}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {:else}
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}
    
    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    {/if}
    
    <div class="bg-white shadow-md rounded my-6">
      <table class="min-w-full">
        <thead>
          <tr class="bg-gray-100 text-gray-700 uppercase text-sm">
            <th class="py-3 px-6 text-left">Email</th>
            <th class="py-3 px-6 text-left">App Source</th>
            <th class="py-3 px-6 text-left">Last Sign In</th>
            <th class="py-3 px-6 text-left">Created At</th>
            <th class="py-3 px-6 text-left">Admin Status</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          {#each users as user (user.id)}
            <tr class="border-b border-gray-200 hover:bg-gray-50">
              <td class="py-4 px-6">{user.email}</td>
              <td class="py-4 px-6">
                <select 
                  class="border rounded px-2 py-1 w-full"
                  value={user.app_source || ''}
                  on:change={(e) => updateUserAppSource(user.id, e.target.value)}
                >
                  <option value="">Default (All features)</option>
                  <option value="limn">Limn (Limited features)</option>
                </select>
              </td>
              <td class="py-4 px-6">{new Date(user.last_sign_in_at).toLocaleString()}</td>
              <td class="py-4 px-6">{new Date(user.created_at).toLocaleString()}</td>
              <td class="py-4 px-6">
                {user.is_admin ? 'Admin' : 'Regular User'}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <div class="mt-4">
      <Button
        variant="primary"
        label={loading ? "Refreshing..." : "Refresh Users"}
        disabled={loading}
        onClick={fetchUsers}
      />
    </div>
  {/if}
</div>
