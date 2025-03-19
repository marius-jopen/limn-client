/**
 * Prepares a workflow by replacing placeholder values with UI input values
 * @param {Object} workflow - The workflow template
 * @param {Array} uiConfig - Array of UI field configurations
 * @param {Object} values - Object containing the current values for UI fields
 * @returns {Object} - The prepared workflow with replaced values
 */

export function prepareWorkflow(workflow, uiConfig, values) {
    console.log('Running prepareWorkflow with values:', values);
    
    // Log all values for debugging
    console.log('All UI values:', values);
    
    // Convert the workflow settings to string for replacement
    let workflowStr = JSON.stringify(workflow);
    console.log('Initial workflow:', workflowStr);
    
    // Process format fields first to handle W/H separately
    const formatFields = uiConfig.filter(field => field.type === 'format');
    formatFields.forEach(field => {
        const formatValue = values[field.id] || field.default || '1024, 1024';
        console.log(`Format field ${field.id}: ${formatValue}`);
        
        // Parse width and height from format string
        const [widthStr, heightStr] = formatValue.split(',').map(v => v.trim());
        const width = parseInt(widthStr, 10) || 1024;
        const height = parseInt(heightStr, 10) || 1024;
        
        console.log(`Parsed W=${width}, H=${height}`);
        
        // Replace W and H as separate numeric properties
        // First, handle the case where they're in the JSON as strings with placeholders
        workflowStr = workflowStr.replace(/"W"\s*:\s*"\${W}"/g, `"W": ${width}`);
        workflowStr = workflowStr.replace(/"H"\s*:\s*"\${H}"/g, `"H": ${height}`);
        
        // Then handle the specific pattern from the example
        workflowStr = workflowStr.replace(/W='\${W}'/g, `W=${width}`);
        workflowStr = workflowStr.replace(/H='\${H}'/g, `H=${height}`);
        
        // Finally replace any remaining placeholders
        workflowStr = workflowStr.replace(/\${W}/g, width);
        workflowStr = workflowStr.replace(/\${H}/g, height);
    });

    // Track if we have a prompts field that needs special handling
    let promptsField = null;

    // Now handle all other fields normally
    uiConfig.forEach(field => {
        const placeholder = field.placeholder;
        
        // Skip format fields (already handled above)
        if (field.type === 'format') {
            return;
        }
        
        // Skip prompts field for now - we'll handle it specially after initial parsing
        if (field.type === 'prompts') {
            promptsField = field;
            console.log('Found prompts field:', field);
            return;
        }
        
        if (field.type === 'int' || field.type === 'number') {
            // Handle numeric values
            const value = Number(values[field.id]);
            
            console.log(`Replacing ${placeholder} with number ${value}`);
            workflowStr = workflowStr.replace(`"${placeholder}"`, value);
        } else {
            // Handle string values
            const value = values[field.id].toString()
                .replace(/\\/g, '\\\\')    // Escape backslashes
                .replace(/"/g, '\\"');      // Escape quotes
            
            console.log(`Replacing ${placeholder} with string "${value}"`);
            workflowStr = workflowStr.replace(placeholder, value);
        }
        
        // Debug: check if replacement worked
        if (workflowStr.includes(placeholder)) {
            console.warn(`Warning: ${placeholder} was not fully replaced!`);
        }
    });

    // Special handling for the prompts field
    if (promptsField) {
        const promptsPlaceholder = promptsField.placeholder;
        const promptsValue = values[promptsField.id];
        
        // console.log(`Handling prompts field, placeholder: ${promptsPlaceholder}, value:`, promptsValue);
        // console.log('Current workflow string before prompts replacement:', workflowStr);
        
        // For prompts, we need to replace the "${PROMPTS}" text with the actual JSON object
        if (typeof promptsValue === 'string' && promptsValue) {
            try {
                // Parse the JSON string to make sure it's valid
                const parsedPrompts = JSON.parse(promptsValue);
                console.log('Successfully parsed prompts JSON:', parsedPrompts);
                
                // Replace the placeholder with the parsed object in JSON string format, but without quotes
                // So instead of "prompts": "${PROMPTS}", we get "prompts": {"0": "prompt text", "5": "other prompt"}
                workflowStr = workflowStr.replace(`"${promptsPlaceholder}"`, promptsValue);
                
                // console.log('After prompts replacement:', workflowStr);
                
                // Verify the replacement worked
                if (workflowStr.includes(`"${promptsPlaceholder}"`)) {
                    console.error(`Failed to replace prompts placeholder: ${promptsPlaceholder}`);
                }
            } catch (err) {
                console.error('Error parsing prompts JSON:', err);
                console.error('Invalid prompts value:', promptsValue);
                // Fallback to using an empty object
                workflowStr = workflowStr.replace(`"${promptsPlaceholder}"`, "{}");
            }
        } else {
            console.warn('No valid prompts value provided, using empty object');
            // Fallback to empty object if no value is provided
            workflowStr = workflowStr.replace(`"${promptsPlaceholder}"`, "{}");
        }
    }

    try {
        // Final check: ensure W and H are numbers in the result
        const result = JSON.parse(workflowStr);
        
        // If the result has deforum_settings with W and H as strings, convert them to numbers
        if (result.deforum_settings) {
            if (typeof result.deforum_settings.W === 'string') {
                result.deforum_settings.W = parseInt(result.deforum_settings.W, 10);
            }
            if (typeof result.deforum_settings.H === 'string') {
                result.deforum_settings.H = parseInt(result.deforum_settings.H, 10);
            }
        }
        
        return result;
    } catch (error) {
        console.error('JSON parsing error:', error);
        console.error('Generated workflow string:', workflowStr);
        throw error;
    }
}
