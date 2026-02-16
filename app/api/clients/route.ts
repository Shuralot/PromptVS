import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clients = await prisma.client.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { agents: true }
                },
                createdBy: { select: { username: true } }
            }
        });

        return NextResponse.json(clients);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const client = await prisma.client.create({
            data: {
                name,
                tenantId: session.user.tenantId,
                createdById: session.user.id
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entity: 'Client',
            entityId: client.id,
            details: `Created client: ${name}`
        });

        return NextResponse.json(client);

    } catch (e) {
        console.error("Error creating client:", e);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
