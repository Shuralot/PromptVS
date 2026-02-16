import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifySocketServer } from '@/lib/socket';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { generateRagnarResponse } from '@/lib/openai';

// Force dynamic
export const dynamic = 'force-dynamic';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Fetch Session
        const session = await prisma.testSession.findUnique({
            where: { id },
            include: { scenario: true }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Update Limits if needed
        let newMaxMessages = session.maxMessages;
        if (session.currentTurn >= session.maxMessages) {
            newMaxMessages = session.maxMessages + 10;
        }

        // 3. Update Status
        const updatedSession = await prisma.testSession.update({
            where: { id },
            data: {
                status: 'RUNNING',
                maxMessages: newMaxMessages,
                // Clear report if we are resuming? Maybe keep it but it will be outdated.
                // Or maybe we don't care. The final report will be generated again at the new end.
                // Let's keep it simple.
            }
        });

        console.log(`[Resume] Session ${id} resumed. Limit: ${session.maxMessages} -> ${newMaxMessages}`);
        await notifySocketServer('session-update', id, { status: 'RUNNING' });

        // 4. Kickstart if last message was from AGENT
        // If the agent spoke last, and we stopped (e.g. due to limit), the Tester never replied.
        // So we need to generate that reply now.
        const lastMessage = await prisma.messageLog.findFirst({
            where: { sessionId: id },
            orderBy: { timestamp: 'desc' }
        });

        if (lastMessage && lastMessage.sender === 'AGENT') {
            console.log(`[Resume] Last message was from AGENT. Triggering Ragnar reply...`);

            // Generate History
            const historyLogs = await prisma.messageLog.findMany({
                where: { sessionId: id },
                orderBy: { timestamp: 'asc' }
            });

            const history = historyLogs.map((m: any) => ({
                role: m.sender === 'TESTER' ? 'assistant' : 'user',
                content: m.content
            })) as { role: 'user' | 'assistant'; content: string }[];

            // Generate Reply
            const reply = await generateRagnarResponse(
                session.scenario.personaSystemPrompt,
                history
            );

            // Send
            await sendWhatsAppMessage(session.targetNumber, reply);

            // Log
            const testerMsg = await prisma.messageLog.create({
                data: {
                    sessionId: id,
                    sender: 'TESTER',
                    content: reply
                }
            });

            await notifySocketServer('message', id, testerMsg);
        }

        return NextResponse.json({ success: true, session: updatedSession });

    } catch (error) {
        console.error("Resume Session Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
