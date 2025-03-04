<script lang="ts">
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import Label from "$lib/atoms/Label.svelte";

    interface Field {
        label: string;
        value: string | number | null | any[] | object;
        isLast?: boolean;
    }

    let fields: Field[] = [];
    
    // Add label prop for the component
    export let label = "";
    export let id = "";
    
    // Allow specifying which service to display
    export let service = ""; // Default to empty, meaning show all services
    
    // Allow specifying which fields to display - expand the default list to show more useful information
    export let displayFields: string[] = [
        "status", 
        "service", 
        "workflow_name",
        "images",
        "logs",
        "statusFields"  // Include statusFields which might contain detailed progress info
    ]; 
    
    // Fields to always exclude (in addition to runpodStatus)
    const excludedFields = ['runpodStatus', 'endpoint_id'];
    
    // Subscribe to runState and convert all properties to fields
    $: {
        if ($runState) {
            // First check if we need to filter by service
            let shouldInclude = true;
            
            // If service is specified and doesn't match the current service, don't show anything
            if (service && $runState.service !== service) {
                shouldInclude = false;
            }
            
            if (shouldInclude) {
                // Create an array to hold all fields
                let allFields: Field[] = [];
                
                // Track which fields we've already added to prevent duplicates
                const addedFields = new Set<string>();
                
                // Helper function to add a field and track it
                const addField = (label: string, value: any) => {
                    // Normalize the label for tracking (lowercase, no spaces)
                    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
                    
                    // Only add if we haven't added this field yet
                    if (!addedFields.has(normalizedLabel)) {
                        allFields.push({ label, value });
                        addedFields.add(normalizedLabel);
                    }
                };
                
                // Always add service and workflow_name at the top if they exist
                if ($runState.service) {
                    addField("Service", $runState.service);
                }
                
                if ($runState.workflow_name) {
                    addField("Workflow Name", $runState.workflow_name);
                }
                
                // Add status if it exists
                if ($runState.status) {
                    addField("Status", $runState.status);
                }
                
                // Add image count if images array exists
                if ($runState.images && Array.isArray($runState.images)) {
                    addField("Images Generated", $runState.images.length);
                }
                
                // Add log count if logs array exists
                if ($runState.logs && Array.isArray($runState.logs)) {
                    addField("Log Entries", $runState.logs.length);
                }
                
                // If statusFields exists and has content, add those next
                if ($runState.statusFields && Array.isArray($runState.statusFields) && $runState.statusFields.length > 0) {
                    // Add statusFields but skip any that would cause duplicates
                    $runState.statusFields.forEach(field => {
                        const normalizedLabel = field.label.toLowerCase().replace(/\s+/g, '');
                        
                        // Skip "status" fields since we already added it
                        // Also skip any field we've already added
                        // Also skip "Endpoint ID" fields
                        if (!normalizedLabel.includes('status') && 
                            !normalizedLabel.includes('endpointid') && 
                            !addedFields.has(normalizedLabel)) {
                            addField(field.label, field.value);
                        }
                    });
                }
                
                // Add other fields from runState that are in displayFields
                Object.entries($runState)
                    .filter(([key]) => 
                        !excludedFields.includes(key) && // Exclude fields in the excludedFields list
                        key !== 'service' && // Already handled
                        key !== 'workflow_name' && // Already handled
                        key !== 'status' && // Already handled
                        key !== 'images' && // Already handled
                        key !== 'logs' && // Already handled
                        key !== 'statusFields' && // Exclude statusFields as we're handling it separately
                        (displayFields.length === 0 || displayFields.includes(key)) // Only include specified fields
                    )
                    .forEach(([key, value]) => {
                        // Format the label by capitalizing and replacing underscores with spaces
                        const label = key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase());
                        
                        const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
                        
                        // Skip if we've already added this field or if it contains "endpoint id"
                        if (addedFields.has(normalizedLabel) || normalizedLabel.includes('endpointid')) {
                            return;
                        }
                        
                        // Format the value based on its type
                        let displayValue: string | number | null | any[] | object;
                        
                        if (value === null) {
                            displayValue = 'None';
                        } else if (Array.isArray(value)) {
                            if (value.length === 0) {
                                displayValue = 'Empty array';
                            } else {
                                displayValue = `${value.length} items`;
                            }
                        } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value);
                        } else {
                            // For primitive types
                            displayValue = value as string | number;
                        }
                        
                        addField(label, displayValue);
                    });
                
                // Set isLast for the last field
                if (allFields.length > 0) {
                    allFields[allFields.length - 1].isLast = true;
                }
                
                fields = allFields;
            } else {
                fields = [];
            }
        }
    }
    
    // Optional: Allow customization of the container styles
    export let containerClass = "";
    export let labelClass = "font-medium p-3 border-b border-gray-200";
    export let valueClass = "p-3 border-b border-gray-200";
</script>


<div>
    <Label for_id={id} {label} />

    {#if fields.length > 0}
        <div class="grid grid-cols-2 border border-gray-200 overflow-hidden bg-white divide-x divide-gray-200">
            {#each fields as {label, value, isLast = false}}
                <div class="contents">
                    <div class={isLast ? labelClass.replace('border-b', '') : labelClass}>
                        {label}:
                    </div>
                    
                    <div class={isLast ? valueClass.replace('border-b', '') : valueClass}>
                        {value}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="p-3 border border-gray-200 bg-white text-gray-500">
            No status information available{service ? ` for ${service}` : ''}.
        </div>
    {/if}
</div> 