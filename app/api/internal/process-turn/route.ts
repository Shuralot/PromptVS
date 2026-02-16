import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRagnarResponse, getAgentAssistantResponse } from '@/lib/openai';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { finalizeSession } from '@/lib/session-manager';
import { notifySocketServer } from '@/lib/socket';

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get('x-internal-key');
        const validKey = process.env.INTERNAL_API_KEY || "secret";
        if (apiKey !== validKey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, sender, messageContent } = await req.json();
        console.log(`[Turn Process] ${sessionId} | From: ${sender} | Content: "${messageContent.slice(0, 20)}..."`);

        // 1. Find Session
        const session = await prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                scenario: true,
                agentVersion: {
                    include: {
                        agent: true
                    }
                }
            }
        });

        if (!session) {
            console.log(`[Turn Process] Session ${sessionId} not found`);
            return NextResponse.json({ ignored: 'Session not found' });
        }

        if (session.status !== 'RUNNING') {
            console.log(`[Turn Process] Session ${sessionId} is NOT RUNNING (Status: ${session.status})`);
            return NextResponse.json({ ignored: 'Session not active' });
        }

        // 2. Turn Logic: Who speaks next?
        if (sender === 'AGENT') {
            // Agent just spoke. Now the TESTER (Adversary) must reply.

            // A. Check Limits
            const newTurnCount = session.currentTurn + 1;
            console.log(`[Turn Process] Turn ${newTurnCount}/${session.maxMessages}`);

            if (newTurnCount >= session.maxMessages) {
                console.log(`[Turn Process] Limit reached. Finalizing.`);
                await finalizeSession(session.id);
                return NextResponse.json({ status: 'Session Completed' });
            }

            // B. Update Turn count
            await prisma.testSession.update({
                where: { id: session.id },
                data: { currentTurn: newTurnCount }
            });

            // C. Generate Tester Reply
            console.log(`[Turn Process] Generating Ragnar Reply...`);
            const historyLogs = await prisma.messageLog.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            });

            const history = historyLogs.map((m: any) => ({
                role: m.sender === 'TESTER' ? 'assistant' : 'user',
                content: m.content
            })) as { role: 'user' | 'assistant'; content: string }[];

            const reply = await generateRagnarResponse(
                session.scenario.personaSystemPrompt,
                history
            );

            // D. Log and Notify
            const loggedMsg = await prisma.messageLog.create({
                data: {
                    sessionId: session.id,
                    sender: 'TESTER',
                    content: reply
                }
            });
            await notifySocketServer('message', session.id, loggedMsg);

            // E. Send to WhatsApp
            console.log(`[Turn Process] Sending Tester Reply to WhatsApp...`);
            await sendWhatsAppMessage(session.targetNumber, reply);

            return NextResponse.json({ ok: true, action: 'tester_replied' });

        } else {
            // TESTER just spoke. Now the AGENT should respond if it's autonomous.
            if (session.agentVersion?.agent?.assistantId) {
                console.log(`[Turn Process] Triggering autonomous Agent...`);

                const { responseText, threadId } = await getAgentAssistantResponse(
                    session.agentVersion.agent.assistantId,
                    session.agentThreadId || null,
                    messageContent
                );

                // Update Session Thread
                await prisma.testSession.update({
                    where: { id: session.id },
                    data: { agentThreadId: threadId }
                });

                // Log and Notify
                const loggedMsg = await prisma.messageLog.create({
                    data: {
                        sessionId: session.id,
                        sender: 'AGENT',
                        content: responseText
                    }
                });
                await notifySocketServer('message', session.id, loggedMsg);

                // Send to WhatsApp
                console.log(`[Turn Process] Sending Agent Response to WhatsApp...`);
                await sendWhatsAppMessage(session.targetNumber, responseText);

                return NextResponse.json({ ok: true, action: 'agent_triggered' });
            }

            console.log(`[Turn Process] Waiting for external human agent.`);
            return NextResponse.json({ ok: true, action: 'waiting_for_external_agent' });
        }

    } catch (error) {
        console.error("Internal Process Turn Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
