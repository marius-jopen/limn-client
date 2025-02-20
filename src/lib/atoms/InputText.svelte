<script lang="ts">
    export let id: string = '';
    export let value: string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
</script>

<input
    class="flex-1 p-2 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    type="text"
    bind:value
    {id}
    {placeholder}
    {disabled}
/> 