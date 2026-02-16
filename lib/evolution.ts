export async function sendWhatsAppMessage(number: string, text: string) {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE_NAME || 'default';

    if (!baseUrl || !apiKey) {
        console.warn("Evolution API not configured. Message mocked:", text);
        return { status: 'mocked' };
    }

    try {
        // Basic Evolution API v2 structure for sending text
        const cleanBaseUrl = baseUrl.replace(/\/$/, ""); 
        const url = `${cleanBaseUrl}/message/sendText/${encodeURIComponent(instance)}`;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: number,
                options: {
                    delay: 1200,
                    presence: 'composing',
                },
                text: text
            })
        });

        // Check if response is ok. Evolution might return 201 for Created.
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Evolution API Error: ${res.status} ${res.statusText} - ${errorBody}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Evolution API Send Error:", error);
        // We rethrow so the caller knows it failed
        throw error;
    }
}
