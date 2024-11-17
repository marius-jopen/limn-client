const SERVER_URL = import.meta.env.SERVER_URL || 'http://localhost:4000/api';

export async function generateImage(endpoint, params) {
    try {
        const response = await fetch(`${SERVER_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
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