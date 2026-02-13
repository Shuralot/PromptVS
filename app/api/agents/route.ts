import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
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
                }
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
                assistantId // Save OpenAI Assistant ID
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

        return NextResponse.json(agent);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }
}
