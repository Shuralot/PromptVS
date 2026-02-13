import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || 'demo-tenant';

        const clients = await prisma.client.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { agents: true }
                }
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
        const body = await req.json();
        const { name, tenantId } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const client = await prisma.client.create({
            data: {
                name,
                tenantId: tenantId || 'demo-tenant'
            }
        });

        return NextResponse.json(client);
    } catch (e) {
        console.error("Error creating client:", e);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
