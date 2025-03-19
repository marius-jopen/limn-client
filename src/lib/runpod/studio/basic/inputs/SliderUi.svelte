<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    import Slider from '$lib/atoms/Slider.svelte';
    import InputText from '$lib/atoms/InputText.svelte';

    export let id: string = '';
    export let label: string = '';
    export let value: number = 0;
    export let placeholder: string = '';
    export let disabled: boolean = false;
    export let min: number = 0;
    export let max: number = 100;
    export let hidden: boolean = false;
</script>

<div class="flex flex-col gap-1 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />
    <div class="flex gap-2">
        <Slider {id} bind:value {min} {max} {disabled} />
        <InputText 
            id={`${id}-input`} 
            bind:value={value} 
            {placeholder} 
            {disabled} 
        />
    </div>
</div>
