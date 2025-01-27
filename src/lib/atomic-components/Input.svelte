<script>
    export let id = '';
    export let value = '';
    export let placeholder = '';
    export let disabled = false;
</script>

<input
    class="flex-1 p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    type="text"
    bind:value
    {id}
    {placeholder}
    {disabled}
/> 