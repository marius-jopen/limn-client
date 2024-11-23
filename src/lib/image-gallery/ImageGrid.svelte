<script>
    export let images = [];
    
    import ImageThumbnail from './ImageThumbnail.svelte';
</script>

<div class="grid grid-cols-1 gap-4 my-8">
    {#each images as image}
        <ImageThumbnail 
            {image}
            on:click
            on:parameterSelect
            on:imageDeleted
        />
    {/each}
</div> 