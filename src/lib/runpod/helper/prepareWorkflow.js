/**
 * Prepares a workflow by replacing placeholder values with UI input values
 * @param {Object} workflow - The workflow template
 * @param {Array} uiConfig - Array of UI field configurations
 * @param {Object} values - Object containing the current values for UI fields
 * @returns {Object} - The prepared workflow with replaced values
 */

export function prepareWorkflow(workflow, uiConfig, values) {
    // Convert the workflow settings to string for replacement
    let workflowStr = JSON.stringify(workflow);
    // console.log('Initial workflow string:', workflowStr);
    console.log('Initial values:', values);

    // Track if we have a prompts field that needs special handling
    let promptsField = null;

    uiConfig.forEach(field => {
        const placeholder = field.placeholder;
        
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
        // console.log('Final workflow string:', workflowStr);
        const parsedWorkflow = JSON.parse(workflowStr);
        return parsedWorkflow;
    } catch (error) {
        console.error('JSON parsing error:', error);
        console.error('Generated workflow string:', workflowStr);
        throw error;
    }
}
