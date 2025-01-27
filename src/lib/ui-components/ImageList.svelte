<script>
    import Label from '$lib/atomic-components/Label.svelte';
    export let images = [];
    export let label;
    export let id;
</script>

{#if images.length > 0}
    <Label for_id={id} {label} />

    <div class="space-y-4">
        {#each images as imageUrl}
            <a target="_blank" href={imageUrl} class="flex items-center gap-4 p-2 bg-white rounded-lg border border-gray-300 rounded-lg">
                <img 
                    src={imageUrl} 
                    alt="Thumbnail" 
                    class="w-48 h-48 object-cover rounded"
                />
                
                <div class="flex flex-col">
                    <span class="text-gray-600 pb-2">
                        {imageUrl.split('/').pop().split('?')[0]}
                    </span>

                    <div class="text-xs text-gray-400 break-all">
                        {imageUrl}
                    </div>
                </div>
            </a>
        {/each}
    </div>
{/if} 