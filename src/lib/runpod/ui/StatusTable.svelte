<script lang="ts">
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    import Label from "$lib/atoms/Label.svelte";

    // DEFINE FIELDS
    
    // Define the Field interface
    // This is about the internal structure of the data that we want to display
    interface Field {
        label: string;
        value: string | number | null | any[] | object;
        isLast?: boolean;
    }

    // DEFINE VARIABLES

    // This is the internal structure of the data that we want to display
    let fields: Field[] = [];
    
    // Add label prop for the component
    export let label = "";
    export let id = "";
    
    // Allow specifying which workflow to display
    // If set, will only show status for this specific workflow
    export let workflow_name = ""; // Default to empty, meaning show all workflows
    
    // Controls which fields from the runState object are displayed in the table.
    // 
    // This property allows customizing which data fields appear in the status table:
    // - If empty array [], all available fields will be displayed
    // - By default, shows common fields like status, service name, and workflow name
    // - Also displays image count, log entries, and any detailed status fields
    export let displayFields: string[] = [
        "status", 
        "service", 
        "workflow_name",
        "images",
        "logs",
        "statusFields"  // Include statusFields which might contain detailed progress info
    ]; 
    
    // Fields to always exclude (in addition to runpodStatus)
    // Those fields dont give us any extra value or dont work well with the current implementation
    const excludedFields = ['runpodStatus', 'endpoint_id'];
    
    // Subscribe to runState and convert all properties to fields
    // This is the main logic of the component
    $: {
        if ($runState) {
            
            // Determine if we should display status information based on workflow filtering
            const shouldInclude = !workflow_name || $runState.workflow_name === workflow_name;
            
            // If we should display status information, then we can proceed with the following logic
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

                        // Add the field to the array
                        allFields.push({ label, value });

                        // Add the field to the set of added fields
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
                
                // Process any remaining fields from runState that weren't explicitly handled above
                // This filter determines which fields to include:
                Object.entries($runState)
                    .filter(([key]) => 
                    
                        // 1. Skip fields that are in our exclusion list (like runpodStatus, endpoint_id)
                        !excludedFields.includes(key) && 
                        
                        // 2. Skip fields we've already processed explicitly above
                        key !== 'service' &&          // Already added at the top of the list
                        key !== 'workflow_name' &&    // Already added at the top of the list
                        key !== 'status' &&           // Already added at the top of the list
                        key !== 'images' &&           // Already handled as "Images Generated" count
                        key !== 'logs' &&             // Already handled as "Log Entries" count
                        key !== 'statusFields' &&     // Handled separately above
                        
                        // 3. Only include fields specified in displayFields prop
                        // If displayFields is empty, include all fields (for maximum flexibility)
                        (displayFields.length === 0 || displayFields.includes(key))
                    )
                    .forEach(([key, value]) => {

                        // STEP 1: FORMAT THE LABEL
                        // Take the raw field name (like "user_id") and make it look nice for display
                        const label = key
                            .replace(/_/g, ' ')         // Replace all underscores with spaces ("user_id" → "user id")
                            .replace(/\b\w/g, l => l.toUpperCase());  // Capitalize first letter of each word ("user id" → "User Id")
                        
                        // STEP 2: CREATE A NORMALIZED VERSION FOR COMPARISON
                        // This helps us detect duplicates even if they have different formatting
                        // Example: "User Id" and "USER_ID" would both normalize to "userid"
                        const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
                        
                        // STEP 3: CHECK FOR DUPLICATES OR EXCLUDED FIELDS
                        // Skip this field if either:
                        // - We've already added a field with this name (using our normalized comparison)
                        // - The field name contains "endpointid" (which we want to exclude)
                        if (addedFields.has(normalizedLabel) || normalizedLabel.includes('endpointid')) {
                            return; // Skip to the next field
                        }
                        
                        // STEP 4: PREPARE THE VALUE FOR DISPLAY
                        // Different types of values need different formatting
                        let displayValue: string | number | null | any[] | object;
                        
                        // STEP 4A: NULL VALUES
                        if (value === null) {
                            displayValue = 'None'; // Show "None" instead of "null"
                        } 

                        // STEP 4B: ARRAY VALUES
                        else if (Array.isArray(value)) {
                            if (value.length === 0) {
                                displayValue = 'Empty array'; // For empty arrays
                            } else {
                                displayValue = `${value.length} items`; // For non-empty arrays, just show the count
                            }
                        } 

                        // STEP 4C: OBJECT VALUES
                        else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value); // Convert objects to JSON string
                        } 

                        // STEP 4D: PRIMITIVE VALUES (strings, numbers)
                        else {
                            displayValue = value as string | number; // Use as-is
                        }
                        
                        // STEP 5: ADD THE FIELD TO OUR DISPLAY LIST
                        // This uses our helper function that also tracks which fields we've added
                        addField(label, displayValue);
                    });
                
                // Set isLast for the last field
                if (allFields.length > 0) {
                    allFields[allFields.length - 1].isLast = true;
                }
                
                // Set the fields to the allFields array
                fields = allFields;
            } else {
                
                // If we should not display status information, then we can set the fields to an empty array
                fields = [];
            }
        }
    }
</script>

<div>
    <Label for_id={id} {label} />

    {#if fields.length > 0}
        <div class="grid grid-cols-2 border border-gray-200 overflow-hidden bg-white divide-y divide-gray-200">
            {#each fields as {label, value}, index}
                <div class="contents">
                    <div class="font-medium p-3 border-b border-gray-200 {index === fields.length - 1 ? 'border-b-0' : ''} border-r">
                        {label}:
                    </div>
                    
                    <div class="p-3 border-b border-gray-200 {index === fields.length - 1 ? 'border-b-0' : ''}">
                        {value}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="p-3 border border-gray-200 bg-white text-gray-500">
            No status information available{workflow_name ? ` for ${workflow_name}` : ''}.
        </div>
    {/if}
</div> 