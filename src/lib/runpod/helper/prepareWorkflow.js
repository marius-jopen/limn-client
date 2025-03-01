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
    // console.log('Initial values:', values);

    uiConfig.forEach(field => {
        const placeholder = field.placeholder;
        
        if (field.type === 'int' || field.type === 'number') {
            // Handle numeric values
            const value = field.id === 'seed' && values[field.id] === -1 
                ? Math.floor(Math.random() * 1000000000) 
                : Number(values[field.id]);
            
            // console.log(`Replacing ${placeholder} with number ${value}`);
            workflowStr = workflowStr.replace(`"${placeholder}"`, value);
        } else {
            // Handle string values
            const value = values[field.id].toString()
                .replace(/\\/g, '\\\\')    // Escape backslashes
                .replace(/"/g, '\\"');      // Escape quotes
            
            // console.log(`Replacing ${placeholder} with string "${value}"`);
            workflowStr = workflowStr.replace(placeholder, value);
        }
        
        // Debug: check if replacement worked
        if (workflowStr.includes(placeholder)) {
            console.warn(`Warning: ${placeholder} was not fully replaced!`);
        }
    });

    // console.log('Final workflow string:', workflowStr);

    try {
        return JSON.parse(workflowStr);
    } catch (error) {
        console.error('JSON parsing error:', error);
        console.log('Generated workflow string:', workflowStr);
        throw error;
    }
}
