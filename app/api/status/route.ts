
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Use SOCKET_SERVER_URL if available (already set in .env for backend communication)
  const socketUrl = process.env.SOCKET_SERVER_URL || `http://socket_server:${process.env.SOCKET_INTERNAL_PORT || 25040}`;
  
  // Predict webhook URL based on the same pattern or use a new env var
  const webhookUrl = process.env.WEBHOOK_INTERNAL_URL || 
                    (process.env.SOCKET_SERVER_URL ? process.env.SOCKET_SERVER_URL.replace('socket', 'webhook').replace('25040', '25050') : null) ||
                    `http://webhook_service:${process.env.WEBHOOK_INTERNAL_PORT || 25050}`;

  let socketStatus = 'offline';
  let webhookStatus = 'offline';

  // Check Socket Server Health
  try {
    console.log(`[Status API] Checking Socket health at: ${socketUrl}/health`);
    const socketRes = await fetch(`${socketUrl}/health`, { 
        method: 'GET',
        cache: 'no-store',
        next: { revalidate: 0 } 
    });
    if (socketRes.ok) {
        socketStatus = 'online';
    } else {
        console.error(`Socket health check returned status: ${socketRes.status}`);
    }
  } catch (error) {
    console.error('Socket health check failed:', error);
  }

  // Check Webhook Service Health
  try {
    console.log(`[Status API] Checking Webhook health at: ${webhookUrl}/health`);
    const webhookRes = await fetch(`${webhookUrl}/health`, { 
        method: 'GET',
        cache: 'no-store',
        next: { revalidate: 0 } 
    });
    if (webhookRes.ok) {
        webhookStatus = 'online';
    } else {
        console.error(`Webhook health check returned status: ${webhookRes.status}`);
    }
  } catch (error) {
    console.error('Webhook health check failed:', error);
  }

  return NextResponse.json({
    socket: socketStatus,
    webhook: webhookStatus,
    timestamp: new Date().toISOString()
  });
}
