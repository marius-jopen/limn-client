<script>
  import { onMount } from 'svelte';
  import Button from '$lib/atoms/Button.svelte';
  import { fade, fly } from 'svelte/transition';
  import LimnGeneratorControls from './LimnGeneratorControls.svelte';
  import LimnGeneratorItem from './LimnGeneratorItem.svelte';

  export let data;
  export let ui_config;
  export let workflow;
  
  // Array to track which image is in focus
  let inFocus = Array(data.length).fill(false);
  
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
  
  // Add state to track dropdown visibility
  let isDropdownOpen = false;
  
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
  
  // Function to toggle dropdown visibility
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }
  
  // Function to close dropdown when clicking outside
  function handleClickOutside(event) {
    if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
      isDropdownOpen = false;
    }
    
    // Close word display when clicking outside
    if (isWordVisible && wordDisplay && !wordDisplay.contains(event.target) && 
        !event.target.closest('.button-container')) {
      isWordVisible = false;
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
    
    // Add event listener for closing dropdown when clicking outside
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      carouselContainer.removeEventListener('scroll', checkCenterImage);
      window.removeEventListener('resize', checkCenterImage);
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="h-[90vh] relative">
  <div 
    bind:this={wordDisplay} 
    class="absolute left-1/2 transform -translate-x-1/2 z-0 w-[30%]"
    style="top: 60vh"
  >
    {#if !isWordVisible}
      <div in:fly={{ duration: 200 }} out:fade={{  duration: 200 }} class="flex gap-2 justify-center relative button-container {buttonFlashActive ? 'button-flash' : ''}">
        <Button 
          label="Explore" 
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={toggleWordVisibility}
        />

        <div class="dropdown-container relative">
          <Button 
            label="..." 
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={toggleDropdown}
            classes="{isDropdownOpen && '!bg-gray-300'}"
          />
          
          {#if isDropdownOpen}
            <div 
              class="overflow-hidden absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg py-2 z-0 min-w-[180px]"
              in:fly={{ y: 5, duration: 200 }}
              out:fade={{ duration: 150 }}
            >
              <Button 
                label="Bookmark" 
                variant="blank"
                size="sm"
                fullWidth={false}
                classes="hover:bg-gray-100 w-full flex !justify-start font-medium"
              />

              <Button 
                label="Preview Video" 
                variant="blank"
                size="sm"
                fullWidth={false}
                classes="hover:bg-gray-100 w-full flex !justify-start font-medium"
              />

              <Button 
                label="Delete Image" 
                variant="blank"
                size="sm"
                fullWidth={false}
                classes="hover:bg-gray-100 w-full flex !justify-start font-medium"
              />

              <Button 
                label="Delete Batch" 
                variant="blank"
                size="sm"
                fullWidth={false}
                classes="hover:bg-gray-100 w-full flex !justify-start font-medium"
              />
            </div>
          {/if}
        </div>

      </div>
    {/if}

    {#if isWordVisible}
      <div 
        class="h-32 absolute top-0 text-sm bg-gray-200 rounded-lg py-2 px-2 w-full text-center"
        in:fly={{ y: -3, duration: 800 }}
        out:fade={{ duration: 400 }}
      >
      <div class="relative">
        <!-- <div class="cursor-pointer absolute top-1 right-1" on:click={toggleWordVisibility}>
          X
        </div> -->

        <div >
          <LimnGeneratorControls data={data} currentFocusedIndex={currentFocusedIndex} ui_config={ui_config} workflow={workflow} />
        </div>
      </div>
      </div>
    {/if}
  </div>

  <!-- Main carousel container -->
  <div 
    bind:this={carouselContainer}
    class="h-full flex flex-row w-full overflow-x-auto snap-x snap-mandatory gap-16 pt-[10%]"
    style="scroll-padding: 0 50%;"
  >
    <!-- Spacer for initial padding -->
    <div class="w-[31vw] flex-shrink-0"></div>
    
    {#each data as item, i}
      <div 
        bind:this={imageContainers[i]}
        class="w-[30vw] h-[30vw] aspect-square rounded-xl overflow-hidden transition-transform duration-300 flex-shrink-0 snap-center"
        style="transform: {inFocus[i] ? 'scale(1.2) translateY(-15%)' : 'scale(1) translateY(0)'}"
      >
        <LimnGeneratorItem item={item} data={data} currentFocusedIndex={currentFocusedIndex} />
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
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
</style>