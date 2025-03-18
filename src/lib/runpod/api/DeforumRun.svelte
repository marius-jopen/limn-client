<script lang="ts">
    import { user } from '$lib/supabase/helper/StoreSupabase';
    import { runState, loadWorkflowState } from '$lib/runpod/helper/StoreRun.js';
    import { prepareWorkflow } from '$lib/runpod/helper/PrepareWorkflow.js';
    import Button from '$lib/atoms/Button.svelte';
    import InputRepeater from '$lib/runpod/components/InputRepeater.svelte';
    import InputController from '$lib/runpod/components/InputController.svelte';
    import { onMount } from 'svelte';

    // TYPESCRIPT TYPES

    // Define the types for the UI config fields
    // This object is the DefoumConfig.json which gets passed from outside
    interface UIConfigField {
        id: string;
        type: string;
        default: string | number;
        label: string;
        placeholder?: string;
    }

    // Define the types for the RunpodStatus
    // This object is the "final result" of this component
    // In includes all the information about the runpod job, the status
    // And even the images that were generated
    // This object updates automatically as the job progresses
    // We do not really export this object but we save it in the localstore
    interface RunpodStatus {
        status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
        delayTime?: number;
        endpointId?: string;
        workerId?: string;
        logs?: string[];
        error?: any;
        output?: Array<{
            images: Array<{
                url: string;
                [key: string]: any;
            }>;
        }>;
    }

    // Define the types for the StatusField
    // This object is only for internal use
    // It defines the structure of the status fields that are displayed in the UI
    interface StatusField {
        label: string;
        value: string;
        isLast?: boolean;
    }

    // Define a type for log entries to fix type errors
    interface LogEntry {
        type: string;
        timestamp: string;
        level: string;
        message: string;
    }

    // Define the structure for the component's internal state
    // This interface acts as a blueprint for all the data this component needs to track
    // It combines both UI-specific state (like status messages) and API data (runpodStatus)
    // The component initializes with these values and can reset to them when needed
    // While runpodStatus contains the API response, InitialState provides the complete picture
    // of what's happening in the component, including:
    //   - Current status in user-friendly terms
    //   - Any error messages
    //   - The job ID for the current run
    //   - A simplified list of generated images for easy display
    //   - The complete RunPod API response
    //   - Aggregated logs from various sources
    // This state is managed internally but parts of it are shared via the runState store
    interface InitialState {
        status: string;
        error: string | null;
        jobId: string | null;
        images: Array<{ url: string; [key: string]: any }>;
        runpodStatus: RunpodStatus | null;
        logs: LogEntry[];
    }

    // VARIABLES

    // Default values for all component state variables
    // Used to initialize the component and reset state when starting a new job
    // Contains empty/null values for status, error, jobId, images, runpodStatus, and logs
    const INITIAL_STATE: InitialState = {
        status: 'Idle',
        error: null,
        jobId: null,
        images: [],
        runpodStatus: null,
        logs: []
    };

    // Initialize all component state variables with default values from INITIAL_STATE
    // This creates separate variables for status, error, jobId, images, runpodStatus, and logs
    // These variables will be updated as the component runs and the job progresses
    let { 
        status, 
        error, 
        jobId, 
        images, 
        runpodStatus, 
        logs 
    } = INITIAL_STATE;
    
    // Component props (inputs) that configure how this component behaves:
    // - service: The RunPod service to use (e.g., "deforum")
    // - workflow_name: Name of the workflow being executed. E.g. "deforum-basic"
    // - workflow: The workflow configuration object (default: empty object). The actual Deforum workflow
    // - ui_config: Array of input field definitions to display to the user (default: empty array)
    // - inputLayout: Control which input component to use (default: 'repeater')
    export let workflow_name: string;
    export let workflow = {};
    export let ui_config: UIConfigField[] = [];
    export let inputLayout: 'repeater' | 'controller' | 'future-layout' = 'repeater'; // Default is repeater
    
    // Create an object to store the current values of all input fields
    // Initializes each field with its default value from the ui_config
    // This object will be updated when the user changes input values
    // The values will be used when preparing the workflow for submission
    let values: Record<string, string | number> = {
        ...Object.fromEntries(ui_config.map(field => [field.id, field.default]))
    };
    
    // The service to use for the RunPod job
    // This is hardcoded to "deforum" for now
    let service = "deforum";

    // Load saved state for this workflow when the component mounts
    onMount(() => {
        if (workflow_name) {
            const savedState = loadWorkflowState(workflow_name);
            // If there are saved values for this workflow, use them
            if (savedState && savedState.values) {
                values = { ...values, ...savedState.values };
            }
        }
    });

    // REACTIVE STATEMENTS
    
    // Get the user ID from the user store
    $: user_id = $user?.id;

    // Define the status fields that are displayed in the UI
    // This reactive statement creates a formatted list of status information
    // The data comes from multiple sources:
    //   - user_id: From Supabase user store
    //   - status: Component's internal status tracking
    //   - runpodStatus: The API response from RunPod
    //   - error: Error messages captured during execution
    //   - jobId: The ID received when the job is created
    // Each field has a user-friendly label and a value with fallbacks if data is missing
    // The isLast property on the final item helps with UI styling
    // This array updates automatically whenever any of the source data changes
    $: statusFields = [
        { label: 'User ID', value: user_id },
        { label: 'Status', value: status || 'Idle' },
        { label: 'RunPod Status', value: runpodStatus?.status || 'Not started' },
        { label: 'Error', value: error || 'No Error' },
        { label: 'Job ID', value: jobId || 'No JobID received' },
        { label: 'Delay Time', value: runpodStatus?.delayTime !== undefined ? `${runpodStatus.delayTime}ms` : 'No delay time available' },
        { label: 'Endpoint ID', value: runpodStatus?.endpointId || 'No endpoint ID available' },
        { label: 'Worker ID', value: runpodStatus?.workerId || 'No worker ID available', isLast: true }
    ] as StatusField[];

    // Update the shared store whenever any component state changes
    // This reactive statement runs automatically when any of these variables change
    // It puts all the important state into the runState store:
    //   - service: Identifies which service generated this data (deforum, comfyui, etc.)
    //   - statusFields: Formatted status information for the UI
    //   - logs: All log messages and errors
    //   - status: Current user-friendly status
    //   - runpodStatus: Complete RunPod API response data
    //   - images: All generated images
    //   - workflow_name: The specific workflow that was executed
    //   - values: The current input values from the user
    // The store makes this data available to other components
    // and automatically saves everything to localStorage
    $: {
        runState.set({
            service,
            workflow_name,
            statusFields,
            logs,
            status,
            runpodStatus,
            images,
            values // Also store the current input values
        });
    }

    // FUNCTIONS

    async function runWorkflow() {
        
        // Generate a timestamp string for the batch name
        // Format: YYYYMMDD_HHMMSS (e.g., "20230615_142230")
        // This ensures each job has a unique identifier based on when it was started
        // The timestamp will be used in file naming and job tracking
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}${date.getSeconds().toString().padStart(2,'0')}`;

        // Reset the images collection before starting a new job
        // First, clear the local images array
        // Then, update the shared store to reflect that images have been cleared
        // This ensures we don't show images from previous runs when starting a new job
        images = [];
        runState.update(state => ({ ...state, images: [] }));
        
        // Reset all state variables to their default values
        // This is a more complete reset than the earlier line that only cleared images
        // Both the component's internal state and the shared store will be updated
        ({ status, error, jobId, images, runpodStatus, logs } = INITIAL_STATE);

        // Update the status to indicate that the job is starting
        status = 'Starting...';

        // Check if the workflow is provided and is not empty
        // We mean the Deforum workflow
        if (!workflow || Object.keys(workflow).length === 0) {
            error = 'No workflow configuration provided';
            status = 'Error';
            return;
        }

        try {
            // Create a deep copy of the workflow and replace BATCH_NAME
            // This is done to ensure that the workflow is not modified by reference
            // and to ensure that the batch name is replaced with the actual timestamp
            // The new workflow is called workflowCopy
            // But it actually is the same workflow except for the batch name
            let workflowCopy = JSON.parse(
                JSON.stringify(workflow).replace('${BATCH_NAME}', dateStr)
            );

            // Processes a workflow template by replacing placeholders with actual user input values
            // Takes three inputs:
            //   1. workflow: The copy of the workflow object from above with placeholders like ${SEED}, ${PROMPTS}, etc.
            //   2. uiConfig: The array of UI field definitions that specify placeholders and types
            //   3. values: The current values from user input in the UI
            // 
            // The function:
            //   - Converts the workflow to a string for text replacement
            //   - Handles different field types differently:
            //     - For numbers: Directly inserts the numeric value
            //     - For strings: Inserts the string with proper escaping
            //     - For prompts: Special handling to insert a JSON object without quotes
            //   - Converts the modified string back to a JSON object
            //   - Returns the prepared workflow ready to be sent to RunPod
            const workflowWithPrompt = prepareWorkflow(workflowCopy, ui_config, values);

            // Send the prepared workflow to the RunPod API server
            // Makes a POST request to the service-specific endpoint
            // Headers include:
            //   - Content-Type: For JSON data
            //   - user-id: To identify who is running the job
            //   - service: Which RunPod service to use (e.g., "deforum")
            //   - workflow: The name of the workflow being executed to save it in Supabase
            //   - batch-name: Unique timestamp identifier for this run
            // The request body contains:
            //   - The complete workflow with all placeholders replaced with user values
            //   - The user ID for tracking and permissions
            // This initiates the job on RunPod and returns a response with the job ID
            const response = await fetch('http://localhost:4000/api/' + service + '-runpod-serverless-run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': user_id,
                    'service': service,
                    'workflow': workflow_name,
                    'batch-name': dateStr
                },
                body: JSON.stringify({ 
                    input: { 
                        workflow: workflowWithPrompt,
                        user: user_id
                    } 
                })
            });

            // If the response is not ok, throw an error
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Parse the response as JSON
            const data = await response.json();

            // Extract the job ID from the response
            jobId = data.data.id;
            
            // Stream the job
            // This is a long-running process that updates the status of the job as it progresses
            // It also collects the output images as they are generated
            // And logs the progress to the console
            await streamJob(jobId);
        } catch (err) {
            // If an error occurs, set the error message and status to "Error"
            error = err.message;
            status = 'Error';
        }
    }

    async function streamJob(id: string): Promise<void> {
        try {
            const eventSource = new EventSource(
                `http://localhost:4000/api/${service}-runpod-serverless-stream/${id}?userId=${user_id}&service=${service}&workflow=${workflow_name}`
            );

            return new Promise<void>((resolve, reject) => {
                // Handle incoming messages from the event source
                // This function is called whenever a new message is received
                // It processes the message data to update the job status, logs, and images
                eventSource.onmessage = (event) => {
                    try {
                        // Extract the JSON data from the event
                        // The data is sent as a string with "data:" prefix
                        // This removes the prefix and parses the JSON
                        const jsonStr = event.data.replace(/^data: /, '');
                        const data = JSON.parse(jsonStr);
                        
                        // Handle error first
                        // If the job fails, log the error and reject the promise
                        if (data.error) {
                            
                            // Create a log entry for the error that occurred
                            // This formats the error information into a structured log object with:
                            //   - type: 'error' (for styling and filtering)
                            //   - timestamp: Current time in ISO format
                            //   - level: 'ERROR' severity indicator
                            //   - message: Formatted error details from RunPod
                            // This log entry will be added to the logs array in the next line
                            // and will appear in the log viewer component
                            const errorLogEntry = {
                                type: 'error',
                                timestamp: new Date().toISOString(),
                                level: 'ERROR',
                                message: `Job failed: ${JSON.stringify(data.error)}`
                            };

                            // Add the error log entry to the logs array
                            logs = [...logs, errorLogEntry];
                            status = 'Error';
                            error = JSON.stringify(data.error);

                            // Close the connection and reject the promise with the error
                            eventSource.close();
                            reject(new Error(data.error));
                            return;
                        }

                        // Update the status based on the RunPod job status
                        // The status comes from the data received in the EventSource message
                        // data.status contains RunPod's status code ('IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED')
                        // For better user experience, we translate 'IN_PROGRESS' to "Running..."
                        // Other statuses are displayed as-is
                        if (data.status) {
                            status = data.status === 'IN_PROGRESS' ? 'Running...' : data.status;
                        }

                        // Add a status log entry
                        // This log entry is used to track the status of the job
                        // It is added to the logs array
                        // The log entry includes:
                        //   - The type of log entry ("worker")
                        //   - The timestamp of the log entry
                        //   - The level of the log entry ("INFO")
                        //   - The message of the log entry ("Status: ${status}")
                        const statusLogEntry = {
                            type: 'worker',
                            timestamp: new Date().toISOString(),
                            level: 'INFO',
                            message: `Status: ${status}`
                        };

                        // Add the status log entry to the logs array
                        logs = [...logs, statusLogEntry];

                        // Update the runpodStatus with the latest data from RunPod
                        // 'data' comes from parsing the JSON in the EventSource message
                        // This contains the complete status update from RunPod including:
                        //   - Current job status
                        //   - Worker information
                        //   - Delay times
                        //   - Any new output or logs
                        // Updating this variable triggers UI refreshes and store updates
                        runpodStatus = data;

                        // Handle stream data and logs
                        // This section processes any new logs or output images
                        // It adds them to the logs array and updates the images collection
                        if (data.stream && Array.isArray(data.stream)) {

                            // Process each item in the stream
                            // This iterates over any new logs or output images
                            // For each item, it creates a log entry and adds it to the logs array
                            data.stream.forEach(streamItem => {

                                // If the item has a log, create a log entry
                                // This log entry is used to track the status of the job
                                // It is added to the logs array
                                // The log entry includes:
                                //   - The type of log entry ("worker")
                                //   - The timestamp of the log entry
                                //   - The level of the log entry ("INFO")
                                //   - The message of the log entry ("${streamItem.output.log}")
                                // This log entry will be added to the logs array in the next line
                                // and will appear in the log viewer component
                                if (streamItem.output?.log) {
                                    const logEntry = {
                                        type: 'worker',
                                        timestamp: new Date().toISOString(),
                                        level: 'INFO',
                                        message: streamItem.output.log
                                    };
                                    
                                    // Add the log entry to the logs array
                                    logs = [...logs, logEntry];
                                }
                            });
                        }

                        // Handle images
                        // This section processes any new output images
                        // It adds them to the images collection
                        // and logs the new images to the console
                        // This is done by checking if the stream item has images
                        if (data.stream && Array.isArray(data.stream)) {

                            // Process each item in the stream
                            // This iterates over any new logs or output images
                            // For each item, it creates a log entry and adds it to the logs array
                            data.stream.forEach(streamItem => {

                                // If the item has images, process them
                                if (streamItem.output?.images && Array.isArray(streamItem.output.images)) {

                                    // Filter out any images that already exist in the images array
                                    // This ensures we don't add duplicates to the images collection
                                    const newImages = streamItem.output.images.filter(img => !images.some(existing => existing.url === img.url));

                                    // If there are new images, add them to the images collection
                                    // This is done by spreading the existing images array with the new images
                                    // This ensures we don't add duplicates to the images collection
                                    if (newImages.length > 0) {

                                        // Add the new images to the images collection
                                        images = [...images, ...newImages];

                                        // Add log entries for new images
                                        // This is done by iterating over the new images
                                        // and adding a log entry for each one
                                        // The log entry includes:
                                        //   - The type of log entry ("worker")
                                        //   - The timestamp of the log entry
                                        //   - The level of the log entry ("INFO")
                                        //   - The message of the log entry ("Generated new image: ${image.url}")
                                        newImages.forEach(image => {
                                            const imageLogEntry = {
                                                type: 'worker',
                                                timestamp: new Date().toISOString(),
                                                level: 'INFO',
                                                message: `Generated new image: ${image.url}`
                                            };

                                            // Add the log entry to the logs array
                                            logs = [...logs, imageLogEntry];
                                        });
                                    }
                                }
                            });
                        }

                        // Check for completion
                        // This section checks if the job is completed or failed
                        // If it is, it adds a log entry to the logs array
                        // and closes the connection
                        // This is done by checking if the status is 'COMPLETED' or 'FAILED'
                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {

                            // Create a log entry for the completion of the job
                            const completionLogEntry = {
                                type: data.status === 'COMPLETED' ? 'worker' : 'error',
                                timestamp: new Date().toISOString(),
                                level: data.status === 'COMPLETED' ? 'INFO' : 'ERROR',
                                message: `Job ${data.status.toLowerCase()}`
                            };

                            // Add the log entry to the logs array
                            logs = [...logs, completionLogEntry];

                            // Close the connection and resolve the promise
                            eventSource.close();

                            // Resolve the promise
                            resolve();
                        }
                    } catch (err) {

                        // Create a log entry for the error that occurred
                        // This log entry is used to track the error that occurred
                        // It is added to the logs array
                        // The log entry includes:
                        //   - The type of log entry ("error")
                        //   - The timestamp of the log entry
                        //   - The level of the log entry ("ERROR")
                        const errorLogEntry = {
                            type: 'error',
                            timestamp: new Date().toISOString(),
                            level: 'ERROR',
                            message: `Stream error: ${err.message}`
                        };

                        console.error('Error log entry:', errorLogEntry);

                        // Add the log entry to the logs array  
                        logs = [...logs, errorLogEntry];

                        // Update the status to indicate that the job is in an error state
                        status = 'Error';

                        // Update the error message
                        error = err.message;

                        // Close the connection and reject the promise with the error
                        eventSource.close();
                        reject(err);
                    }
                };

                // Handle errors from the event source
                // This section handles any errors that occur from the event source
                // It creates a log entry for the error and logs it to the console
                // It does not close the connection on error, let it auto-reconnect
                eventSource.onerror = (err: Event) => {
                    const errorLogEntry: LogEntry = {
                        type: 'error',
                        timestamp: new Date().toISOString(),
                        level: 'ERROR',
                        message: `EventSource error: ${err instanceof ErrorEvent ? err.message : 'Unknown error'}`
                    };

                    console.error('EventSource error:', err);
                    logs = [...logs, errorLogEntry];
                    console.warn('EventSource error occurred, waiting for reconnection');
                };

                // Set a timeout of 10 minutes
                // This is to prevent the connection from hanging indefinitely
                // If the job takes too long to complete, it will be killed
                // And the promise will be rejected with an error
                setTimeout(() => {
                    eventSource.close();
                    reject(new Error('Stream timeout: Job took too long to complete'));
                }, 10 * 60 * 1000);
            });

        } catch (err) {
            error = err.message;
            status = 'Error';
            throw err;
        }
    }

    // Function to cast the UI config to the expected type for InputRepeater
    function castUIConfig(config: UIConfigField[]) {
        return config as any;
    }
</script>

<div>
    {#if inputLayout === 'controller'}
        <InputController UI={castUIConfig(ui_config)} bind:values />
    {:else if inputLayout === 'future-layout'}
        <!-- Placeholder for future layout component -->
        <div class="p-4 bg-yellow-100 rounded mb-4">
            <p class="text-sm">Future layout not yet implemented - falling back to repeater</p>
            <InputRepeater UI={castUIConfig(ui_config)} bind:values />
        </div>
    {:else}
        <!-- Default to repeater -->
        <InputRepeater UI={castUIConfig(ui_config)} bind:values />
    {/if}
    <Button onClick={runWorkflow} label="Generate" disabled={status === 'Running...' || status === 'Starting...' || status === 'IN_PROGRESS'} />
</div>