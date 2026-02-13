import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const [clientCount, agentCount, sessionCount] = await Promise.all([
            prisma.client.count(),
            prisma.agent.count(),
            prisma.testSession.count()
        ]);

        const recentSessions = await prisma.testSession.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                agentVersion: {
                    include: { agent: true }
                }
            }
        });

        return NextResponse.json({
            stats: {
                clients: clientCount,
                agents: agentCount,
                sessions: sessionCount,
            },
            recentSessions
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
