export async function notifySocketServer(type: string, sessionId: string, data: any) {
    try {
        const socketServerUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:4000';
        console.log(`[Socket] Notifying ${socketServerUrl} about ${type} for session ${sessionId}`);

        await fetch(`${socketServerUrl}/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                sessionId,
                data,
            }),
        });
    } catch (error) {
        console.error('[Socket] Failed to notify socket server:', error);
    }
}
