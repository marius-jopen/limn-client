<script>
      import Button from '$lib/atoms/Button.svelte';

      export let currentFocusedIndex;
      export let data;
</script>

<Button 
    label="Bookmark {currentFocusedIndex}" 
    variant="secondary"
    size="sm"
    fullWidth={false}
/>