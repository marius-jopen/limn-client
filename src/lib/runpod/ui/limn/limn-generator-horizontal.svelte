<script>
  import { onMount } from 'svelte';
  import Button from '$lib/atoms/Button.svelte';
  import { fade, fly } from 'svelte/transition';
  import BookmarkImage from '$lib/supabase/media/BookmarkImage.svelte';
  import LimnGeneratorControls from './LimnGeneratorControls.svelte';

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
  
  // State to track button flash effect
  let buttonFlashActive = false;
  
  // Reference to DOM elements using Svelte bindings
  let imageContainers = [];
  let carouselContainer;
  let wordDisplay;
  
  // State to track if word is visible
  let isWordVisible = false;
  
  // Track the currently focused index
  let currentFocusedIndex = -1;
  
  // Get the currently active word and handle focus changes
  $: {
    const activeIndex = inFocus.findIndex((focus) => focus === true);
    
    // If the focused image has changed
    if (activeIndex !== currentFocusedIndex && activeIndex >= 0) {
      // Hide the word
      isWordVisible = false;
      
      // Trigger flash effect on the buttons
      buttonFlashActive = true;
      
      // Reset flash after 1 second
      setTimeout(() => {
        buttonFlashActive = false;
      }, 1000);
      
      // Update current focused index
      currentFocusedIndex = activeIndex;
    }
  }
  
  // Get the active word
  $: activeWord = (() => {
    const activeIndex = inFocus.findIndex((focus) => focus === true);
    return activeIndex >= 0 ? images[activeIndex].word : "New";
  })();
  
  // Function to toggle word visibility
  function toggleWordVisibility() {
    isWordVisible = !isWordVisible;
  }
  
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


<div class="h-[95vh] relative">
  <!-- Fixed word display at the bottom center using Svelte binding -->
  <div 
    bind:this={wordDisplay} 
    class="absolute left-1/2 transform -translate-x-1/2 z-10 w-[25%]"
    style="top: 60vh"
  >
    {#if !isWordVisible}
      <div class="flex gap-2 justify-center relative {buttonFlashActive ? 'button-flash' : ''}">
        <Button 
          label="Remix" 
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={toggleWordVisibility}
        />

        <BookmarkImage />
      </div>
    {/if}

    {#if isWordVisible}
      <div 
        class="h-32 absolute top-0 text-sm bg-gray-200 rounded-lg py-2 px-4 w-full text-center"
        in:fly={{ y: 0, duration: 800 }}
        out:fade={{ duration: 400 }}
      >
      <div class="relative px-4 py-4">
        <div class="cursor-pointer absolute top-1 right-1" on:click={toggleWordVisibility}>
          X
        </div>

        <div>
          <LimnGeneratorControls />
        </div>
      </div>
      </div>
    {/if}
  </div>
  
  <!-- Threshold lines for debugging -->
  <!-- <div class="fixed top-0 h-full w-[1px] bg-red-500 z-50" style="left: 30vw;"></div> -->
  <!-- <div class="fixed top-0 h-full w-[1px] bg-red-500 z-50" style="left: 70vw;"></div> -->
  
  <!-- Main carousel container -->
  <div 
    bind:this={carouselContainer}
    class="h-full flex flex-row w-full overflow-x-auto snap-x snap-mandatory gap-16 pt-[10%]"
    style="scroll-padding: 0 50%;"
  >
    <!-- Spacer for initial padding -->
    <div class="w-[31vw] flex-shrink-0"></div>
    
    {#each images as item, i}
      <div 
        bind:this={imageContainers[i]}
        class="w-[30vw] h-[30vw] aspect-square rounded-xl overflow-hidden transition-transform duration-300 flex-shrink-0 snap-center"
        style="transform: {inFocus[i] ? 'scale(1.2) translateY(-15%)' : 'scale(1) translateY(0)'}"
      >
        <img src={item.url} alt="{item.word}" class="w-full h-full object-cover" />
      </div>
    {/each}
    
    <!-- Spacer for final padding -->
    <div class="w-[31vw] flex-shrink-0"></div>
  </div>
</div>


<style>
  .button-flash {
    animation: flash 1s ease-out;
  }
  
  @keyframes flash {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
</style>