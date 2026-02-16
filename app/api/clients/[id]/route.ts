import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    try {
        const client = await prisma.client.update({
            where: { id },
            data: { 
                name,
                updatedById: session.user.id
            }
        });

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'Client',
            entityId: id,
            details: `Updated client name to: ${name}`
        });

        return NextResponse.json(client);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        // Fetch client name for audit before deleting
        const client = await prisma.client.findUnique({ where: { id } });

        await prisma.client.delete({
            where: { id }
        });

        if (client) {
            await logAudit({
                userId: session.user.id,
                action: 'DELETE',
                entity: 'Client',
                entityId: id,
                details: `Deleted client: ${client.name}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
