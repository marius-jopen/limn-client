<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import { onMount } from 'svelte';

    export let id: string = '';
    export let label: string = '';
    export let value: number | string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
    export let hidden: boolean = false;
    
    // Use a local variable to store the random number
    let randomNumber: number;
    
    // Generate a random number between 0 and 1000 by default
    const generateRandomNumber = () => Math.floor(Math.random() * 1000);
    
    // Set the random value immediately and on mount
    randomNumber = generateRandomNumber();
    
    onMount(() => {
        // Force a new random number on mount
        randomNumber = generateRandomNumber();
        // Also update the bound value
        value = randomNumber;
        
        // Add debugging
        console.log("Generated random number:", randomNumber);
    });
</script>

<div class="flex flex-col gap-1 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <div class="p-2 border rounded bg-gray-50" id={id}>
        <!-- Display our local random number directly -->
        {randomNumber}
    </div>
</div> 