import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/versions/[id]/sessions
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // versionId

        const sessions = await prisma.testSession.findMany({
            where: { agentVersionId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                report: {
                    select: { score: true, summary: true } // Include score for quick view
                },
                scenario: {
                    select: { title: true, difficulty: true }
                }
            }
        });

        return NextResponse.json(sessions);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
