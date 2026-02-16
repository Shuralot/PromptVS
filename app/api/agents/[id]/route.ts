import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use shared instance
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                client: true,
                _count: { select: { versions: true } }
            }
        });
        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        return NextResponse.json(agent);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();
        const { name, description, assistantId } = body;

        const agent = await prisma.agent.update({
            where: { id },
            data: {
                name,
                description,
                assistantId,
                updatedById: session.user.id
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'Agent',
            entityId: id,
            details: `Updated agent: ${name}`
        });

        return NextResponse.json(agent);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        // Fetch agent name for audit log
        const agent = await prisma.agent.findUnique({ where: { id } });

        await prisma.agent.delete({
            where: { id }
        });

        if (agent) {
             await logAudit({
                userId: session.user.id,
                action: 'DELETE',
                entity: 'Agent',
                entityId: id,
                details: `Deleted agent: ${agent.name}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete agent (may have active versions)' }, { status: 500 });
    }
}
