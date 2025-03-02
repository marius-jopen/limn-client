<script lang="ts">
    export let id: string = '';
    export let value: boolean = false;
    export let disabled: boolean = false;
    export let label: string = '';
</script>

<label 
    class="relative inline-flex items-center cursor-pointer {disabled ? 'opacity-50' : ''}"
    {id}
>
    <input
        type="checkbox"
        class="sr-only peer"
        bind:checked={value}
        {disabled}
    />
    <div
        class="w-11 h-6 bg-gray-200 rounded-full peer 
        peer-focus:ring-2 peer-focus:ring-blue-500
        peer-checked:after:translate-x-full 
        peer-checked:after:border-white 
        after:content-[''] 
        after:absolute 
        after:top-0.5 
        after:left-[2px] 
        after:bg-white 
        after:border-gray-300 
        after:border 
        after:rounded-full 
        after:h-5 
        after:w-5 
        after:transition-all 
        peer-checked:bg-blue-600"
    ></div>
    {#if label}
        <span class="ml-3 text-sm font-medium text-gray-900">{label}</span>
    {/if}
</label> 