import { NextResponse } from 'next/server';

// This webhook has been moved to the external 'webhook-service'
// to comply with the new architecture where reception is handled outside the main app.
// Please update your Evolution API webhook URL to: http://<your-server>:5001/webhook

export async function POST() {
    return NextResponse.json({ 
        error: 'Webhook moved', 
        message: 'This endpoint is deprecated. Use the external webhook-service on port 5001.' 
    }, { status: 410 });
}

