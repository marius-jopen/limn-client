<script>
    import { onMount } from 'svelte';
  
    // Number of items in the slider
    export let items = 40;
    
    // Currently active/centered item index (start with 0 which is item 1)
    let activeIndex = 0;
    
    // Container element reference
    let container;
    let thumbnailTrack;
    
    // Item dimensions
    const thumbnailWidth = 90; // Width of thumbnail items
    const activeWidth = 600; // Width of active item
    const itemMargin = 5; // Margin on each side
    
    // Generate placeholder items with random colors
    const placeholderItems = Array.from({ length: items }, (_, i) => {
      const hue = Math.floor(Math.random() * 360);
      return {
        id: i,
        color: `hsl(${hue}, 70%, 60%)`,
      };
    });
    
    // Get the active item
    $: activeItem = placeholderItems[activeIndex];
    
    // Handle click on a thumbnail to make it active
    function handleThumbnailClick(index) {
      activeIndex = index;
      scrollToThumbnail(index);
    }
    
    // Scroll to center a specific thumbnail
    function scrollToThumbnail(index) {
      if (thumbnailTrack) {
        const thumbnailElement = thumbnailTrack.querySelector(`[data-index="${index}"]`);
        if (thumbnailElement) {
          thumbnailElement.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
      }
    }
    
    // Handle scroll on the thumbnail track
    function handleThumbnailScroll() {
      if (thumbnailTrack) {
        const thumbnails = thumbnailTrack.querySelectorAll('.thumbnail-item');
        const trackRect = thumbnailTrack.getBoundingClientRect();
        const trackCenter = trackRect.left + (trackRect.width / 2);
        
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        thumbnails.forEach((thumbnail) => {
          const thumbnailRect = thumbnail.getBoundingClientRect();
          const thumbnailCenter = thumbnailRect.left + (thumbnailRect.width / 2);
          const distance = Math.abs(thumbnailCenter - trackCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = parseInt(thumbnail.dataset.index);
          }
        });
        
        if (closestIndex !== activeIndex) {
          activeIndex = closestIndex;
        }
      }
    }
    
    onMount(() => {
      // Add scroll event listener with throttling
      let scrollTimeout;
      if (thumbnailTrack) {
        thumbnailTrack.addEventListener('scroll', () => {
          if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
              handleThumbnailScroll();
              scrollTimeout = null;
            }, 100);
          }
        });
      }
      
      // Initial scroll to active thumbnail
      setTimeout(() => {
        scrollToThumbnail(activeIndex);
      }, 100);
      
      return () => {
        if (thumbnailTrack) {
          thumbnailTrack.removeEventListener('scroll', handleThumbnailScroll);
        }
        clearTimeout(scrollTimeout);
      };
    });
  </script>
  
  <div class="relative w-full flex flex-col bg-gray-100 rounded-lg">
    <!-- Main active item display -->
    <div class="w-full flex-grow flex items-center justify-center p-4">
      <div 
        class="flex-shrink-0 flex items-center justify-center relative shadow-lg outline outline-[3px] outline-red-500 rounded-lg"
        style="
          background-color: {activeItem?.color || 'transparent'};
          width: {activeWidth}px;
          height: {activeWidth}px;
        "
      >
        <span class="text-white font-bold text-4xl drop-shadow-md">{activeIndex + 1}</span>
        <div class="absolute bottom-0 left-0 w-full h-24 bg-black bg-opacity-70 text-white text-center flex items-center justify-center text-2xl rounded-b-lg">
          REMIX
        </div>
      </div>
    </div>
    
    <!-- Thumbnail scrolling track -->
    <div 
      class="w-full h-[120px] overflow-x-auto overflow-y-hidden flex items-center px-4"
      bind:this={thumbnailTrack}
    >
      <div class="flex items-center mx-auto">
        {#each placeholderItems as item, i}
          <div 
            class="thumbnail-item mx-[5px] flex-shrink-0 flex items-center justify-center cursor-pointer relative shadow-md rounded-lg {i === activeIndex ? 'ring-2 ring-white' : ''}"
            style="
              background-color: {item.color};
              width: {thumbnailWidth}px;
              height: {thumbnailWidth}px;
            "
            data-index={i}
            on:click={() => handleThumbnailClick(i)}
          >
            <span class="text-white font-bold text-lg drop-shadow-md">{i + 1}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>