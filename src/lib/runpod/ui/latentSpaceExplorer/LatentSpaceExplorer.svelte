<script>
    import { onMount } from 'svelte';
  
    // Number of items in the slider
    export let items = 40;
    
    // Currently active/centered item index (start with 0 which is item 1)
    let activeIndex = 0;
    
    // Container element reference
    let container;
    
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
    
    // Get items before the active item
    $: leftItems = placeholderItems.slice(0, activeIndex);
    
    // Get items after the active item
    $: rightItems = placeholderItems.slice(activeIndex + 1);
    
    // Handle click on a thumbnail to make it active
    function handleThumbnailClick(index) {
      activeIndex = index;
      scrollToCenter();
    }
    
    // Scroll the container to center the active item
    function scrollToCenter() {
      if (container) {
        const activeElement = container.querySelector('.active-item');
        if (activeElement) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeElement.getBoundingClientRect();
          
          const targetScrollLeft = (activeRect.left + activeRect.width/2) - (containerRect.left + containerRect.width/2) + container.scrollLeft;
          
          container.scrollTo({
            left: targetScrollLeft,
            behavior: 'auto'
          });
        }
      }
    }
    
    // Handle scroll on the container
    function handleScroll() {
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + (containerRect.width / 2);
        
        // Get all items (thumbnails and active)
        const allItems = container.querySelectorAll('.item');
        
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        allItems.forEach((item) => {
          const itemRect = item.getBoundingClientRect();
          const itemCenter = itemRect.left + (itemRect.width / 2);
          const distance = Math.abs(itemCenter - containerCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = parseInt(item.dataset.index);
          }
        });
        
        if (closestIndex !== activeIndex) {
          activeIndex = closestIndex;
          // Don't auto-scroll here to allow free scrolling
        }
      }
    }
    
    onMount(() => {
      // Add scroll event listener with throttling
      let scrollTimeout;
      if (container) {
        container.addEventListener('scroll', () => {
          if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
              handleScroll();
              scrollTimeout = null;
            }, 100);
          }
        });
      }
      
      // Initial scroll to center
      setTimeout(() => {
        scrollToCenter();
      }, 100);
      
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
        clearTimeout(scrollTimeout);
      };
    });
</script>

<div 
  class="w-full h-[650px] overflow-x-auto overflow-y-hidden flex items-center bg-gray-100 rounded-lg"
  bind:this={container}
>
  <div class="flex items-center" style="padding-left: calc(50% - {thumbnailWidth/2}px); padding-right: calc(50% - {thumbnailWidth/2}px);">
    <!-- Left thumbnails -->
    {#each leftItems as item, i}
      <button 
        class="item thumbnail-item mx-[5px] flex-shrink-0 flex items-center justify-center cursor-pointer relative shadow-md rounded-lg"
        style="
          background-color: {item.color};
          width: {thumbnailWidth}px;
          height: {thumbnailWidth}px;
          border: none;
          padding: 0;
        "
        data-index={i}
        on:click={() => handleThumbnailClick(i)}
        aria-label="Select item {i + 1}"
      >
        <span class="text-white font-bold text-lg drop-shadow-md">{i + 1}</span>
      </button>
    {/each}
    
    <!-- Active item (larger) -->
    <div 
      class="item active-item mx-[5px] flex-shrink-0 flex items-center justify-center relative shadow-lg outline outline-[3px] outline-red-500 rounded-lg"
      style="
        background-color: {activeItem?.color || 'transparent'};
        width: {activeWidth}px;
        height: {activeWidth}px;
      "
      data-index={activeIndex}
      role="region"
      aria-label="Active item {activeIndex + 1}"
    >
      <span class="text-white font-bold text-4xl drop-shadow-md">{activeIndex + 1}</span>
      <div class="absolute bottom-0 left-0 w-full h-24 bg-black bg-opacity-70 text-white text-center flex items-center justify-center text-2xl rounded-b-lg">
        REMIX
      </div>
    </div>
    
    <!-- Right thumbnails -->
    {#each rightItems as item, i}
      <button 
        class="item thumbnail-item mx-[5px] flex-shrink-0 flex items-center justify-center cursor-pointer relative shadow-md rounded-lg"
        style="
          background-color: {item.color};
          width: {thumbnailWidth}px;
          height: {thumbnailWidth}px;
          border: none;
          padding: 0;
        "
        data-index={activeIndex + 1 + i}
        on:click={() => handleThumbnailClick(activeIndex + 1 + i)}
        aria-label="Select item {activeIndex + 1 + i + 1}"
      >
        <span class="text-white font-bold text-lg drop-shadow-md">{activeIndex + 1 + i + 1}</span>
      </button>
    {/each}
  </div>
</div>