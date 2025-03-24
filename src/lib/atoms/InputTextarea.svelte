<script lang="ts">
    export let id: string = "";
    export let value: string = "";
    export let readonly: boolean = false;
</script>

<textarea
    class="w-full p-2 border border-gray-200 {readonly ? 'bg-gray-50' : ''}"
    bind:value
    {id}
    {readonly}
></textarea> 