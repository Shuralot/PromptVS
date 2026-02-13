import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { agents: true }
                }
            }
        });
        if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        return NextResponse.json(client);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name } = await req.json();
        const client = await prisma.client.update({
            where: { id },
            data: { name }
        });
        return NextResponse.json(client);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Cascading delete considerations? 
        // Prisma will throw error if there are agents unless defined in schema.
        await prisma.client.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete client (may have active agents)' }, { status: 500 });
    }
}
