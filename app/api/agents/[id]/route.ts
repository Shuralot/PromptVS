import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, description, assistantId } = body;

        const agent = await prisma.agent.update({
            where: { id },
            data: {
                name,
                description,
                assistantId,
                updatedAt: new Date()
            }
        });
        return NextResponse.json(agent);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.agent.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete agent (may have active versions)' }, { status: 500 });
    }
}
