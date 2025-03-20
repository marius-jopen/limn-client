<script>
  import { goto } from '$app/navigation';
  import Button from '$lib/atoms/Button.svelte';
</script>

<div class="flex flex-col justify-center items-center h-screen">
  <div class="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
    <h1 class="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
    <p class="mb-6">
      You don't have permission to access this page. Please contact your administrator if you believe this is an error.
    </p>
    <Button 
      variant="primary" 
      label="Go to Dashboard" 
      onClick={() => goto('/dashboard')} 
    />
  </div>
</div> 