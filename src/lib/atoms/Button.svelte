<script lang="ts">
    import type { ComponentType } from 'svelte';

    // Define valid variants and sizes
    type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    type ButtonSize = 'sm' | 'md' | 'lg';

    // Core functionality
    export let onClick: () => void = () => {};
    export let disabled: boolean = false;
    export let type: 'button' | 'submit' | 'reset' = "button";

    // Content
    export let label: string = "Monitor";
    export let icon: ComponentType | null = null; // Optional icon component

    // Styling
    export let variant: ButtonVariant = "primary";
    export let size: ButtonSize = "md";
    export let fullWidth: boolean = false;
    export let classes: string = ""; // Renamed from class to classes

    // Dynamic classes based on props
    const variantClasses = {
        primary: "bg-primary text-black hover:bg-primary/80",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        danger: "bg-red-500 text-white hover:bg-red-700",
        success: "bg-green-500 text-white hover:bg-green-700",
        warning: "bg-yellow-500 text-white hover:bg-yellow-700",
        blank: "bg-transparent text-black"
    };

    const sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    $: buttonClasses = `
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        transition-colors
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex
        items-center
        justify-center
        gap-2
        w-fit
        rounded-full
        ${classes}
    `.trim().replace(/\s+/g, ' ');
</script>

<button 
    class={buttonClasses}
    on:click={onClick}
    {type}
    {disabled}
>
    {#if icon}
        <span class="inline-flex items-center">
            {icon}
        </span>
    {/if}

    {label}
</button> 