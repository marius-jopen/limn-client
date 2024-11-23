<script>
    export let image;
    
    import { createEventDispatcher } from 'svelte';
    import ParameterCopyButton from './ParameterCopyButton.svelte';
    import DeleteButton from './DeleteImageButton.svelte';

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch('click', image);  // Dispatch the full image object
    }
</script>

<div class="relative group">
    <img 
        class="rounded-md w-full cursor-pointer" 
        src={image.url} 
        alt="Generated image" 
        on:click={handleClick}
    />

    <ParameterCopyButton 
        image={image.name} 
        on:parameterSelect
    />

    <DeleteButton 
        image={image.url} 
        on:imageDeleted
    />
</div> 