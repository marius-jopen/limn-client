<script lang="ts">
    export let id: string = '';
    export let value: number = 0;
    export let placeholder: string = '';
    export let disabled: boolean = false;
    export let min: number = 0;
    export let max: number = 100;
</script>

<input 
    type="range"
    class="flex-1"
    bind:value
    {min}
    {max}
    {disabled}
    {id}
/>
