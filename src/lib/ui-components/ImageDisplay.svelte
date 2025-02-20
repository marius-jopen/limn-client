<script>
    import Label from '../atoms/Label.svelte';

    export let imageUrl = null;
    export let id = '';
    export let label = '';

    let showOverlay = false;
</script>

{#if imageUrl}
    <div class="flex flex-col gap-2">
        <Label for_id={id} {label} />

        <button 
            on:click={() => showOverlay = true} 
            class="w-full text-left flex items-center gap-4"
        >
            <img 
                src={imageUrl} 
                alt="Thumbnail" 
                class="w-80 h-80 object-cover rounded"
            />
            
            <div class="flex flex-col">
                <span class="text-gray-600 pb-2">
                    {imageUrl.split('/').pop().split('?')[0]}
                </span>

                <div class="text-xs text-gray-400 break-all">
                    {imageUrl}
                </div>
            </div>
        </button>
    </div>
{/if}

{#if showOverlay}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        on:click={() => showOverlay = false}
    >
        <div class="relative">
            <img 
                src={imageUrl} 
                alt="Full size" 
                class="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button 
                class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
                on:click={() => showOverlay = false}
            >
                ✕
            </button>
        </div>
    </div>
{/if} 