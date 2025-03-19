<script lang="ts">
    import Label from '$lib/atoms/Label.svelte';
    
    interface DropdownOption {
        value: string;
        label: string;
    }

    export let id: string = "";
    export let value: string = "";
    export let options: DropdownOption[] = [];
    export let label: string = "";
    export let hidden: boolean = false;
</script>

<div class="flex flex-col gap-2 {hidden ? 'hidden' : ''}">
    <Label for_id={id} {label} />

    <select
        {id}
        bind:value
        class="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    >
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
</div>
