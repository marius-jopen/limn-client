<script lang="ts">
    export let label: string = '';
    export let onClick: () => void = () => {};
    export let disabled: boolean = false;
    export let customClass: string = '';
</script>

<div 
    on:click={onClick} 
    class="block bg-neutral-200 pt-1.5 pb-2 px-4 text-sm rounded-full cursor-pointer w-fit hover:bg-neutral-300 transition-colors duration-200 {disabled ? 'opacity-50 cursor-not-allowed' : ''} {customClass}"
>
    {label}
</div> 