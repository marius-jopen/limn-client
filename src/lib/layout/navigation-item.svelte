<script>
  import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let href = "";
  export let imageSrc = "";
  export let imageAlt = "";
  export let title = "";
  
  // Transform the image URL using the BunnyClient
  const transformedImageSrc = transformToBunnyUrl(imageSrc);
  
  function handleClick(e) {
    e.preventDefault();
    console.log("Navigation item clicked:", href);
    dispatch('navigate', { href });
  }
</script>

<a {href} on:click={handleClick} class="flex flex-col w-[200px] transition-transform duration-[600ms] ease-in-out hover:scale-[1.02] group">
  <img 
    class="aspect-square w-[200px] h-[200px] object-cover rounded-xl transition-all duration-[600ms] ease-in-out group-hover:shadow-lg group-hover:-translate-y-1"
    src={transformedImageSrc + "?width=200"} 
    alt={imageAlt}
  >

  <div class="text-center pt-4">
    {title}
  </div>
</a>
