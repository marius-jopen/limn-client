<script>
    import Label from '../atomic-components/Label.svelte';

    export let imageUrl = null;
    export let id = '';
    export let label = '';
</script>

{#if imageUrl}
    <div class="flex flex-col gap-2">
        <Label for_id={id} {label} />

        <a target="_blank" href={imageUrl} class="flex items-center gap-4 p-2 bg-white rounded-lg border border-gray-300 rounded-lg">
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
        </a>
    </div>
{/if} 