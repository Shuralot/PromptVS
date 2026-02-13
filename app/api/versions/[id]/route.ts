import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/versions/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { versionNumber, config } = body;

        const version = await prisma.agentVersion.update({
            where: { id },
            data: {
                versionNumber,
                config
            }
        });

        return NextResponse.json(version);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update version' }, { status: 500 });
    }
}

// DELETE /api/versions/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Optional: Check for existing sessions before delete? 
        // For now, let's assume cascade delete or error if FK constraint.
        // Prisma schema doesn't have onDelete: Cascade explicitly set for sessions -> version, 
        // so this might fail if sessions exist. 
        // Better to check or wrap in try/catch.

        await prisma.agentVersion.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete version (may have associated test sessions)' }, { status: 500 });
    }
}
