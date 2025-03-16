<script>
  import { onMount } from 'svelte';
  import Button from '$lib/atoms/Button.svelte';
  import { fade, fly } from 'svelte/transition';
  import LimnGeneratorControls from './LimnGeneratorControls.svelte';
  import LimnGeneratorItem from './LimnGeneratorItem.svelte';
  import LimnGeneratorBuilder from './LimnGeneratorBuilder.svelte';

  export let data;
  export let ui_config;
  export let workflow;
  export let isFirstRow = false;
  export let startWithUIOpen = false;
  
  // Array to track which image is in focus
  let inFocus = Array(data.length).fill(false);
  let isGeneratorFocused = false;
  
  // State to track button flash effect
  let buttonFlashActive = false;
  
  // Reference to DOM elements using Svelte bindings
  let imageContainers = [];
  let generatorContainer;
  let carouselContainer;
  let wordDisplay;
  
  // State to track if word is visible
  let isWordVisible = startWithUIOpen;
  
  // Track the currently focused index
  let currentFocusedIndex = -1;
  
  // Add state to track dropdown visibility
  let isDropdownOpen = false;
  
  // Get the currently active word and handle focus changes
  $: {
    const activeIndex = inFocus.findIndex((focus) => focus === true);
    
    // If the focused image has changed
    if (activeIndex !== currentFocusedIndex && activeIndex >= 0) {
      // Only hide the word if we're not in the generator row with startWithUIOpen
      if (!startWithUIOpen || !isFirstRow) {
        isWordVisible = false;
      }
      
      // Close the dropdown when focus changes
      isDropdownOpen = false;
      
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
    // If this is the generator row and startWithUIOpen is true, only allow reopening
    if (isFirstRow && startWithUIOpen && isWordVisible) {
      return; // Only prevent closing, not reopening
    }
    isWordVisible = !isWordVisible;
    
    // If we're showing the word, make sure the current focused item is centered
    if (isWordVisible && currentFocusedIndex >= 0) {
      scrollToImage(currentFocusedIndex);
    }
  }
  
  // Function to scroll to a specific image
  function scrollToImage(index) {
    const container = imageContainers[index];
    
    if (container && carouselContainer) {
      // Get the current position of the image
      const imageRect = container.getBoundingClientRect();
      
      // Get the current scroll position
      const currentScrollLeft = carouselContainer.scrollLeft;
      
      // Calculate how far the image is from the center of the viewport
      const viewportCenter = window.innerWidth / 2;
      const imageCenter = imageRect.left + (imageRect.width / 2);
      const offset = imageCenter - viewportCenter;
      
      // Calculate the new scroll position by adjusting the current position
      const newScrollLeft = currentScrollLeft + offset;
      
      // Apply the scroll
      carouselContainer.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }
  
  // Function to scroll to generator
  function scrollToGenerator() {
    if (generatorContainer && carouselContainer) {
      const rect = generatorContainer.getBoundingClientRect();
      const currentScrollLeft = carouselContainer.scrollLeft;
      const viewportCenter = window.innerWidth / 2;
      const elementCenter = rect.left + rect.width / 2;
      const offset = elementCenter - viewportCenter;
      
      carouselContainer.scrollTo({
        left: currentScrollLeft + offset,
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
      isGeneratorFocused = false;
      
      // Find the image closest to the center
      let closestIndex = -1;
      let smallestDistance = Infinity;
      
      // Check generator first if this is the first row
      if (isFirstRow && generatorContainer) {
        const rect = generatorContainer.getBoundingClientRect();
        const elementCenter = rect.left + rect.width / 2;
        smallestDistance = Math.abs(elementCenter - centerPoint);
        isGeneratorFocused = true;
        closestIndex = -1;
      }
      
      // Then check all images
      imageContainers.forEach((container, index) => {
        if (container) {
          const rect = container.getBoundingClientRect();
          const elementCenter = rect.left + rect.width / 2;
          const distance = Math.abs(elementCenter - centerPoint);
          
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
            isGeneratorFocused = false;
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
      if (isFirstRow) {
        scrollToGenerator();
      } else {
        scrollToImage(0);
      }
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

<div class="h-[800px] relative">
  <div 
    bind:this={wordDisplay} 
    class="absolute left-1/2 transform -translate-x-1/2 z-0 w-[600px] z-20"
    style="top: 620px"
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
              class="overflow-hidden absolute bottom-0 right-0 mr-[-185px] bg-gray-200 rounded-lg py-2 z-0 min-w-[180px]"
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
        class="absolute top-0 text-sm bg-gray-200 rounded-lg py-2 px-2 w-full text-center"
        in:fly={{ y: -3, duration: 800 }}
        out:fade={{ duration: 400 }}
      >
        <div class="relative">
          <!-- Close button (x) in the top right -->
          <button 
              class="absolute top-0 right-1 text-gray-500 hover:text-gray-700 z-10 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-300"
              on:click={() => isWordVisible = false}
              title="Close"
          >
              ×
          </button>
          
          <LimnGeneratorControls 
            data={data} 
            currentFocusedIndex={currentFocusedIndex} 
            ui_config={ui_config}
            workflow={workflow}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Main carousel container -->
  <div 
    bind:this={carouselContainer}
    class="h-full flex flex-row w-full overflow-x-auto snap-x snap-mandatory gap-16 pt-[10%] hide-scrollbar"
    style="scroll-padding: 0 50%;"
  >
    <!-- Spacer for initial padding -->
    <div class="w-[31vw] flex-shrink-0"></div>
    
    {#if isFirstRow}
      <!-- Generator Builder -->
      <div 
        bind:this={generatorContainer}
        class="w-[450px] h-[450px] aspect-square rounded-xl overflow-hidden transition-transform duration-300 flex-shrink-0 snap-center"
        style="transform: {isGeneratorFocused ? 'scale(1.2) translateY(-38px)' : 'scale(1) translateY(0)'}"
      >
        <LimnGeneratorBuilder />
      </div>
    {/if}

    {#each data as item, i}
      <div
        bind:this={imageContainers[i]}
        class="w-[450px] h-[450px] aspect-square rounded-xl overflow-hidden transition-transform duration-300 flex-shrink-0 snap-center"
        style="transform: {inFocus[i] ? 'scale(1.2) translateY(-38px)' : 'scale(1) translateY(0)'}"
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

  /* Hide scrollbar while maintaining scroll functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
</style>