/**
 * Prepares a workflow by replacing placeholder values with UI input values
 * @param {Object} workflow - The workflow template
 * @param {Array} uiConfig - Array of UI field configurations
 * @param {Object} values - Object containing the current values for UI fields
 * @returns {Object} - The prepared workflow with replaced values
 */

export function prepareWorkflow(workflow, uiConfig, values) {
    let workflowStr = JSON.stringify(workflow);

    uiConfig.forEach(field => {
        const value = field.type === 'int' 
            ? (field.id === 'seed' && values[field.id] === -1 
                ? Math.floor(Math.random() * 1000000000) 
                : values[field.id])
            : JSON.stringify(values[field.id]);

        workflowStr = workflowStr.replace(
            `"${field.placeholder}"`, 
            field.type === 'int' ? value : value
        );
    });

    return JSON.parse(workflowStr);
}
