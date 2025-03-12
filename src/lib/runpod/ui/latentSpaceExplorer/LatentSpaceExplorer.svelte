<script>
    import { onMount } from 'svelte';
  
    // Number of items in the slider
    export let items = 40;
    
    // Currently active/centered item index (start with 0 which is item 1)
    let activeIndex = 0;
    
    // Container element reference
    let container;
    let sliderTrack;
    
    // Item width and spacing
    const itemWidth = 80; // Width of small items
    const itemGap = 10; // Gap between items
    const activeScale = 1.5; // How much larger the active item should be
    
    // Generate placeholder items with random colors
    const placeholderItems = Array.from({ length: items }, (_, i) => {
      const hue = Math.floor(Math.random() * 360);
      return {
        id: i,
        color: `hsl(${hue}, 70%, 60%)`,
      };
    });
    
    // Handle click on an item to make it active
    function handleItemClick(index) {
      activeIndex = index;
      scrollToItem(index);
    }
    
    // Scroll to center a specific item
    function scrollToItem(index) {
      if (container) {
        const itemTotalWidth = itemWidth + 10; // width + margins
        const targetScrollPosition = (index * itemTotalWidth) - (container.offsetWidth / 2) + (itemWidth / 2) + initialOffset;
        container.scrollTo({
          left: targetScrollPosition,
          behavior: 'smooth'
        });
      }
    }
    
    // Calculate the offset needed to center the first item
    function getInitialOffset() {
      if (container) {
        const containerWidth = container.offsetWidth;
        return (containerWidth / 2) - (itemWidth / 2);
      }
      return 0;
    }
    
    // Calculate the end offset needed to center the last item
    function getEndOffset() {
      if (container) {
        const containerWidth = container.offsetWidth;
        return (containerWidth / 2) - (itemWidth / 2);
      }
      return 0;
    }
    
    // Update active item based on scroll position
    function handleScroll() {
      if (container && sliderTrack) {
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.offsetWidth;
        const itemTotalWidth = itemWidth + 10; // width + margins
        
        // Calculate the center of the viewport
        const viewportCenter = scrollLeft + (containerWidth / 2);
        
        // Find which item is closest to the center
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        // Get all item elements
        const itemElements = sliderTrack.querySelectorAll('.slider-item');
        
        itemElements.forEach((item, index) => {
          // Get the item's position relative to the document
          const itemRect = item.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate the center of the item relative to the viewport
          const itemCenter = itemRect.left + (itemRect.width / 2) - containerRect.left;
          
          // Calculate the distance from the viewport center
          const distance = Math.abs(itemCenter - (containerWidth / 2));
          
          // Update closest item if this one is closer
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        // Update active index if it changed
        if (closestIndex !== activeIndex) {
          activeIndex = closestIndex;
        }
      }
    }
    
    let initialOffset = 0;
    let endOffset = 0;
    
    onMount(() => {
      // Calculate initial and end offsets when component mounts
      initialOffset = getInitialOffset();
      endOffset = getEndOffset();
      
      // Add scroll event listener with throttling to improve performance
      let scrollTimeout;
      container.addEventListener('scroll', () => {
        if (!scrollTimeout) {
          scrollTimeout = setTimeout(() => {
            handleScroll();
            scrollTimeout = null;
          }, 50); // Throttle to 50ms
        }
      });
      
      // Recalculate on window resize
      const handleResize = () => {
        initialOffset = getInitialOffset();
        endOffset = getEndOffset();
        // Re-center the active item after resize
        scrollToItem(activeIndex);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('scroll', handleScroll);
      };
    });
  </script>
  
  <div class="slider-container" bind:this={container}>
    <div class="slider-track" bind:this={sliderTrack} style="padding-left: {initialOffset}px; padding-right: {endOffset}px;">
      {#each placeholderItems as item, i}
        <div 
          class="slider-item" 
          style="
            background-color: {item.color};
            transform: scale({i === activeIndex ? activeScale : 1});
          "
          class:active={i === activeIndex}
          on:click={() => handleItemClick(i)}
        >
          <span class="item-number">{i + 1}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .slider-container {
      width: 100%;
      height: 300px;
      overflow-x: auto;
      overflow-y: hidden;
      position: relative;
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 8px;
      scroll-behavior: smooth;
    }
    
    .slider-track {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
    }
    
    .slider-item {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      margin: 0 5px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }
    
    .slider-item.active {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      outline: 3px solid red;
      z-index: 10;
    }
    
    .item-number {
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
  </style>