/**
 * Image Generation API Client Module
 * 
 * This module provides functionality to interact with the server's image generation endpoints.
 * It exports a single function that handles making POST requests to generate images.
 * 
 * The function:
 * - Takes an endpoint, parameters, and userId as input
 * - Makes a POST request to the server with the provided data
 * - Handles error cases and response validation
 * - Returns the server response for further processing
 * 
 * @serverUrl - Retrieved from environment variables (VITE_SERVER_URL)
 */

const serverUrl = import.meta.env.VITE_SERVER_URL;

export async function generateImage(endpoint, params, userId) {
    try {
        const response = await fetch(`${serverUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...params,
                userId: userId
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}