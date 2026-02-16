import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');

        if (!clientId) {
            return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
        }

        const agents = await prisma.agent.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { versions: true }
                },
                createdBy: { select: { username: true } }
            }
        });

        return NextResponse.json(agents);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, description, clientId, assistantId } = body;

        if (!name || !clientId) {
            return NextResponse.json({ error: 'Name and Client ID are required' }, { status: 400 });
        }

        const agent = await prisma.agent.create({
            data: {
                name,
                description,
                clientId,
                assistantId,
                createdById: session.user.id
            }
        });

        // Create initial default version
        await prisma.agentVersion.create({
            data: {
                agentId: agent.id,
                versionNumber: 'v1.0 (Initial)',
                config: {}
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entity: 'Agent',
            entityId: agent.id,
            details: `Created agent: ${name}`
        });

        return NextResponse.json(agent);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }
}
