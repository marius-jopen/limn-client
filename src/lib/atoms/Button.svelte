<script>
    // Core functionality
    export let onClick = () => {};
    export let disabled = false;
    export let type = "button";

    // Content
    export let label = "Monitor";
    export let icon = null; // Optional icon component

    // Styling
    export let variant = "primary"; // primary, secondary, danger, success, warning
    export let size = "md"; // sm, md, lg
    export let fullWidth = false;

    // Dynamic classes based on props
    const variantClasses = {
        primary: "bg-blue-500 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        danger: "bg-red-500 text-white hover:bg-red-700",
        success: "bg-green-500 text-white hover:bg-green-700",
        warning: "bg-yellow-500 text-white hover:bg-yellow-700"
    };

    const sizeClasses = {
        sm: "px-2 py-1 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    $: classes = `
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium
        transition-colors
        duration-200
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        focus:ring-${variant === 'secondary' ? 'gray' : variant}-500
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex
        items-center
        justify-center
        gap-2
        w-fit
    `.trim().replace(/\s+/g, ' ');
</script>

<button 
    class={classes}
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