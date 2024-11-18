const SERVER_URL = import.meta.env.SERVER_URL;

export async function generateImage(endpoint, params, userId) {
    try {
        const response = await fetch(`${SERVER_URL}/${endpoint}`, {
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