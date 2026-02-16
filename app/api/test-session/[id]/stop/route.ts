import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifySocketServer } from '@/lib/socket';
import { finalizeSession } from '@/lib/session-manager';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await prisma.testSession.findUnique({
            where: { id }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session.status !== 'RUNNING') {
            return NextResponse.json({ message: 'Session is not running' });
        }

        // Update status
        const updatedSession = await prisma.testSession.update({
            where: { id },
            data: { status: 'COMPLETED' } // Change to COMPLETED to trigger UI report view
        });

        // Trigger Analysis
        await finalizeSession(id);

        return NextResponse.json({ success: true, session: updatedSession });

    } catch (error) {
        console.error("Stop Session Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
