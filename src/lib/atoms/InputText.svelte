<script lang="ts">
    export let id: string = '';
    export let value: string = '';
    export let placeholder: string = '';
    export let disabled: boolean = false;
</script>

<input
    class="rounded-full w-full px-4 py-2 border border-gray-200 focus:ring-1 focus:ring-primary focus:border-primary"
    type="text"
    bind:value
    {id}
    {placeholder}
    {disabled}
/> 