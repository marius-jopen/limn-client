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
  
  // Array to track which image is in focus (including the empty box)
  let inFocus = Array(images.length + 1).fill(false);
  
  // Reference to all containers (including the empty box)
  let imageContainers = [];
  
  // Get the currently active word
  $: activeWord = (() => {
    // Skip the first element (empty box) when finding the active word
    const activeIndex = inFocus.findIndex((focus, index) => focus === true && index > 0);
    return activeIndex > 0 ? images[activeIndex - 1].word : "New";
  })();
  
  onMount(() => {
    // Function to check which element is in the middle third of the viewport
    function checkCenterImage() {
      const viewportHeight = window.innerHeight;
      const lowerBound = viewportHeight * 0.30; // 30% from the top
      const upperBound = viewportHeight * 0.70; // 70% from the top
      
      // Update the word display height
      const wordDisplay = document.getElementById('word-display');
      if (wordDisplay) {
        wordDisplay.style.top = `${lowerBound}px`;
        wordDisplay.style.height = `${upperBound - lowerBound}px`;
      }
      
      imageContainers.forEach((container, index) => {
        if (container) {
          const rect = container.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          
          // Check if the element's center is within the middle third of the viewport
          inFocus[index] = elementCenter >= lowerBound && elementCenter <= upperBound;
        }
      });
      
      inFocus = [...inFocus]; // Trigger reactivity
    }
    
    // Check on scroll and initial load
    window.addEventListener('scroll', checkCenterImage);
    window.addEventListener('resize', checkCenterImage);
    checkCenterImage();
    
    return () => {
      window.removeEventListener('scroll', checkCenterImage);
      window.removeEventListener('resize', checkCenterImage);
    };
  });
</script>

<!-- Fixed word display at right 20% with height spanning from lowerBound to upperBound -->
<div 
  id="word-display" 
  class="fixed -mt-[2.5vh] left-[68%] w-[20%] flex items-center"
>
        <Button 
        label="Remix {activeWord}" 
        variant="secondary"
        size="sm"
        fullWidth={false}
        />
</div>

<!-- Threshold lines -->
<!-- <div class="fixed left-0 w-full h-[1px] bg-red-500 z-50" style="top: 30vh;"></div> -->
<!-- <div class="fixed left-0 w-full h-[1px] bg-red-500 z-50" style="top: 70vh;"></div> -->

<div class="flex flex-col items-center w-full gap-[80px] pb-4 pt-[30vh] pb-[35vh]">
  <!-- Empty gray box at the top with scaling effect -->
  <div 
    bind:this={imageContainers[0]}
    class="w-[25%] aspect-square bg-neutral-200 rounded-xl transition-transform duration-[500ms]"
    style="transform: scale({inFocus[0] ? 1.2 : 1})">
  </div>
  
  {#each images as item, i}
    <div 
      bind:this={imageContainers[i + 1]}
      class="w-[25%] rounded-xl overflow-hidden transition-transform duration-[500ms]"
      style="transform: scale({inFocus[i + 1] ? 1.2 : 1})">
      <img src={item.url} alt="{item.word}" class="w-full h-full object-cover" />
    </div>
  {/each}
</div>
