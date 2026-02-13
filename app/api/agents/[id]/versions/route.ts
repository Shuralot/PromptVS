import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/agents/[id]/versions
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // agentId

        const versions = await prisma.agentVersion.findMany({
            where: { agentId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { sessions: true }
                }
            }
        });

        return NextResponse.json(versions);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { versionNumber, config } = body;

        const version = await prisma.agentVersion.create({
            data: {
                agentId: id,
                versionNumber,
                config
            }
        });

        return NextResponse.json(version);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
    }
}
