<script>
  import { createEventDispatcher } from 'svelte';
  
  let dragActive = false;
  let initImage = null;
  let fileInput;
  
  const dispatch = createEventDispatcher();
  
  // Track drag counter to handle nested elements
  let dragCounter = 0;
  
  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    dragActive = true;
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      dragActive = false;
    }
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = true; // Ensure highlight stays active during dragover
  }
  
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    dragCounter = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }
  
  // Reset drag state when mouse leaves the window
  function handleWindowDragEnd() {
    dragActive = false;
    dragCounter = 0;
  }
  
  function handleFileInput(e) {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }
  
  function handleFiles(files) {
    const file = files[0];
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        initImage = e.target.result;
        dispatch('imageSelected', { 
          image: initImage,
          file: file
        });
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  function removeImage() {
    initImage = null;
    dispatch('imageSelected', { image: null, file: null });
  }
  
  // Add and remove global event listeners
  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    window.addEventListener('dragend', handleWindowDragEnd);
    window.addEventListener('dragleave', (e) => {
      if (e.clientX === 0 && e.clientY === 0) {
        handleWindowDragEnd();
      }
    });
  });
  
  onDestroy(() => {
    window.removeEventListener('dragend', handleWindowDragEnd);
    window.removeEventListener('dragleave', handleWindowDragEnd);
  });
</script>

<div 
  class="w-[450px] h-[450px] aspect-square rounded-xl overflow-hidden transition-all duration-300 flex-shrink-0 snap-center {dragActive ? 'bg-indigo-100 border-2 border-indigo-300' : 'bg-gray-200'} flex flex-col items-center justify-center gap-4"
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  on:click={() => !initImage && fileInput.click()}
>
  {#if initImage}
    <div class="relative w-full h-full">
      <img src={initImage} alt="Initial image" class="w-full h-full object-cover" />
      <button 
        class="absolute top-4 right-4 bg-black bg-opacity-40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-60 transition-all"
        on:click|stopPropagation={removeImage}
        aria-label="Remove image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center text-center p-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 {dragActive ? 'text-indigo-500' : 'text-gray-400'} mb-2 transform transition-transform hover:scale-110 hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-600 font-medium">Drop an initial image here</p>
      <p class="text-gray-400 text-sm mt-1">or click to browse</p>
      <div class="mt-4 text-sm text-gray-600 font-medium">
        ✨ Totally optional, but this can give you amazing results! ✨
      </div>
    </div>
  {/if}
  
  <input 
    type="file" 
    accept="image/*" 
    class="hidden" 
    bind:this={fileInput} 
    on:change={handleFileInput}
  />
</div>