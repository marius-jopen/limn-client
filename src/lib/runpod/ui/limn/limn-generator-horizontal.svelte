<script>
  import { onMount } from 'svelte';
  import Button from '$lib/atoms/Button.svelte';

  // Array with image URLs and words
  let images = [
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Nature" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Adventure" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Explore" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Discover" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Journey" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Wonder" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Inspire" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Create" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Imagine" },
    { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Dream" }
  ];
  
  // Array to track which image is in focus
  let inFocus = Array(images.length).fill(false);
  
  // Reference to all containers
  let imageContainers = [];
  let carouselContainer;
  
  // Get the currently active word
  $: activeWord = (() => {
    const activeIndex = inFocus.findIndex((focus) => focus === true);
    return activeIndex >= 0 ? images[activeIndex].word : "New";
  })();
  
  // Function to scroll to a specific image
  function scrollToImage(index) {
    if (imageContainers[index] && carouselContainer) {
      const containerRect = carouselContainer.getBoundingClientRect();
      const imageRect = imageContainers[index].getBoundingClientRect();
      
      // Calculate the scroll position to center the image
      const scrollLeft = imageContainers[index].offsetLeft - (containerRect.width / 2) + (imageRect.width / 2);
      
      carouselContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }
  
  onMount(() => {
    // Function to check which element is in the middle of the viewport horizontally
    function checkCenterImage() {
      const viewportWidth = window.innerWidth;
      const centerPoint = viewportWidth / 2;
      
      // Update the word display position
      const wordDisplay = document.getElementById('word-display');
      if (wordDisplay) {
        wordDisplay.style.top = `${window.innerHeight * 0.7}px`;
      }
      
      // Reset all focus states first
      inFocus = inFocus.map(() => false);
      
      // Find the image closest to the center
      let closestIndex = -1;
      let smallestDistance = Infinity;
      
      imageContainers.forEach((container, index) => {
        if (container) {
          const rect = container.getBoundingClientRect();
          const elementCenter = rect.left + rect.width / 2;
          const distance = Math.abs(elementCenter - centerPoint);
          
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
          }
        }
      });
      
      // Set focus for the closest element
      if (closestIndex >= 0) {
        inFocus[closestIndex] = true;
      }
      
      inFocus = [...inFocus]; // Trigger reactivity
    }
    
    // Check on scroll and initial load
    carouselContainer.addEventListener('scroll', checkCenterImage);
    window.addEventListener('resize', checkCenterImage);
    
    // Initial check after a short delay to ensure DOM is fully rendered
    setTimeout(() => {
      checkCenterImage();
      // Start with the first image in focus
      scrollToImage(0);
    }, 200);
    
    return () => {
      carouselContainer.removeEventListener('scroll', checkCenterImage);
      window.removeEventListener('resize', checkCenterImage);
    };
  });
</script>

<!-- Fixed word display at the bottom center -->
<div 
  id="word-display" 
  class="fixed left-1/2 transform -translate-x-1/2 z-10"
>
  <Button 
    label="Remix {activeWord}" 
    variant="secondary"
    size="sm"
    fullWidth={false}
  />
</div>

<!-- Threshold lines for debugging -->
<div class="fixed top-0 h-full w-[1px] bg-red-500 z-50" style="left: 30vw;"></div>
<div class="fixed top-0 h-full w-[1px] bg-red-500 z-50" style="left: 70vw;"></div>

<!-- Main carousel container -->
<div 
  bind:this={carouselContainer}
  class="flex flex-row items-center w-full overflow-x-auto snap-x snap-mandatory py-8 min-h-screen gap-16"
  style="scroll-padding: 0 50%;"
>
  <!-- Spacer for initial padding -->
  <div class="w-[31vw] flex-shrink-0"></div>
  
  {#each images as item, i}
    <div 
      bind:this={imageContainers[i]}
      class="min-w-[30vw] w-[30vw] aspect-square rounded-xl overflow-hidden transition-transform duration-300 flex-shrink-0 snap-center"
      style="transform: scale({inFocus[i] ? 1.2 : 1});"
    >
      <img src={item.url} alt="{item.word}" class="w-full h-full object-cover" />
    </div>
  {/each}
  
  <!-- Spacer for final padding -->
  <div class="w-[31vw] flex-shrink-0"></div>
</div>
