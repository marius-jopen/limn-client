<script lang="ts">
    export let id: string = "";
    export let value: string = "";
</script>

<textarea
    class="w-full p-2 border border-gray-200"
    bind:value
    {id}
></textarea> 