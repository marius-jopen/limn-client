<script>
  import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
  
  export let href = "";
  export let imageSrc = "";
  export let imageAlt = "";
  export let title = "";
  
  // Transform the image URL using the BunnyClient
  const transformedImageSrc = transformToBunnyUrl(imageSrc);
</script>

<a {href} class="flex flex-col w-[200px]">
  <img class="aspect-square w-[200px] h-[200px] object-cover rounded-xl" src={transformedImageSrc} alt={imageAlt}>
  <div class="text-center pt-2">
    {title}
  </div>
</a>
