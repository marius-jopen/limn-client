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
    // console.log('Initial workflow:', workflowStr);
    
    // Process format fields first to handle W/H separately
    const formatFields = uiConfig.filter(field => 
        field.type === 'format' || field.type === 'format-select'
    );
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
        if (field.type === 'format' || field.type === 'format-select') {
            return;
        }
        
        // Skip prompts field for now
        if (field.type === 'prompts') {
            promptsField = field;
            return;
        }
        
        if (field.type === 'int' || field.type === 'number' || field.type === 'int-dropdown') {
            // Handle numeric values
            const value = Number(values[field.id]);
            
            // Special handling for schedule parameters
            if (field.id === 'strenght_schedule' || field.id === 'cfg_scale_schedule') {
                const scheduleValue = `0: (${value})`;
                console.log(`Replacing ${placeholder} with schedule string "${scheduleValue}"`);
                workflowStr = workflowStr.replace(`"${placeholder}"`, `"${scheduleValue}"`);
            } else {
                console.log(`Replacing ${placeholder} with number ${value}`);
                workflowStr = workflowStr.replace(`"${placeholder}"`, value);
            }
        } else {
            // Handle string values
            let value = values[field.id].toString();
            
            // Add prefix if it exists in the field config
            if (field.prefix) {
                value = `${field.prefix} ${value}`;
            }
            
            value = value
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

    // Special handling for camera field
    const cameraField = uiConfig.find(field => field.type === 'camera');
    if (cameraField && values[cameraField.id]) {
        const cameraValues = values[cameraField.id];
        
        // Replace camera-related placeholders
        workflowStr = workflowStr
            .replace('${TRANSLATION_X}', cameraValues.x)
            .replace('${TRANSLATION_Y}', cameraValues.y)
            .replace('${TRANSLATION_Z}', cameraValues.z)
            .replace('${TRANSFORM_CENTER_X}', cameraValues.center_x)
            .replace('${TRANSFORM_CENTER_Y}', cameraValues.center_y)
            .replace('${ROTATION_3D_X}', cameraValues.rotation_x)
            .replace('${ROTATION_3D_Y}', cameraValues.rotation_y)
            .replace('${ROTATION_3D_Z}', cameraValues.rotation_z);
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
