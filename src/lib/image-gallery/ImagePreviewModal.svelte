<script>
    export let selectedImage;
    console.log('Modal received selectedImage:', selectedImage);
    
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let imageError = false;

    // Reset error state when selected image changes
    $: if (selectedImage) {
        imageError = false;
    }

    function handleKeydown(event) {
        if (event.key === 'ArrowRight') dispatch('next');
        else if (event.key === 'ArrowLeft') dispatch('previous');
        else if (event.key === 'Escape') dispatch('close');
    }

    function handleImageError() {
        imageError = true;
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div 
    class="fixed inset-0 bg-black bg-opacity-85 z-50 flex items-center justify-center"
    on:click={() => dispatch('close')}
>
    <button
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl opacity-75 hover:opacity-100"
        on:click|stopPropagation={() => dispatch('previous')}
    >
        ‹
    </button>

    <button
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl opacity-75 hover:opacity-100"
        on:click|stopPropagation={() => dispatch('next')}
    >
        ›
    </button>

    <div class="max-w-[90vw] max-h-[90vh]">
        <button
            class="absolute top-1 right-4 text-3xl text-white"
            on:click|stopPropagation={() => dispatch('close')}
        >
            ×
        </button>

        {#if !selectedImage?.url}
            <div class="text-white text-xl p-8" on:click|stopPropagation>
                No image URL provided
            </div>
        {:else if imageError}
            <div class="text-white text-xl p-8" on:click|stopPropagation>
                Unable to load image: {selectedImage.url}
            </div>
        {:else}
            <img 
                src={selectedImage.url} 
                alt={selectedImage.name || 'Preview'} 
                class="max-w-full max-h-[90vh] object-contain"
                on:click|stopPropagation
                on:error={handleImageError}
            />
        {/if}
    </div>
</div> 