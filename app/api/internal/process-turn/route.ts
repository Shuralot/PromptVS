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
            console.warn(`[Turn Process] ABORTED: Session ${sessionId} not found in DB`);
            return NextResponse.json({ ignored: 'Session not found' });
        }

        if (session.status !== 'RUNNING') {
            console.info(`[Turn Process] IGNORED: Session ${sessionId.slice(0,8)} status is ${session.status}`);
            return NextResponse.json({ ignored: 'Session not active' });
        }

        // 2. Turn Logic: Who speaks next?
        if (sender === 'AGENT') {
            console.log(`[Turn Process] AGENT spoke. Preparing Ragnar (Tester) reply for session ${session.id.slice(0,8)}`);
            
            // A. Check Limits
            const newTurnCount = session.currentTurn + 1;
            console.log(`[Turn Process] Turn advancement: ${newTurnCount}/${session.maxMessages}`);

            if (newTurnCount >= session.maxMessages) {
                console.log(`[Turn Process] LIMIT REACHED. Finalizing session ${session.id.slice(0,8)}`);
                await finalizeSession(session.id);
                return NextResponse.json({ status: 'Session Completed' });
            }

            // B. Update Turn count
            await prisma.testSession.update({
                where: { id: session.id },
                data: { currentTurn: newTurnCount }
            });

            // C. Generate Tester Reply
            const historyLogs = await prisma.messageLog.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            });

            const history = historyLogs.map((m: any) => ({
                role: m.sender === 'TESTER' ? 'assistant' : 'user',
                content: m.content
            })) as { role: 'user' | 'assistant'; content: string }[];

            console.log(`[Turn Process] Generating Ragnar response with ${history.length} messages in history...`);
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
            try {
                console.log(`[Turn Process] Delivering Ragnar reply to WhatsApp (${session.targetNumber})...`);
                await sendWhatsAppMessage(session.targetNumber, reply);
                console.log(`[Turn Process] WhatsApp delivery SUCCESS`);
            } catch (whatsappError: any) {
                console.error(`[Turn Process] WhatsApp delivery FAILED:`, whatsappError.message);
            }

            return NextResponse.json({ ok: true, action: 'tester_replied' });

        } else {
            // TESTER just spoke. Now the AGENT should respond if it's autonomous.
            if (session.agentVersion?.agent?.assistantId) {
                console.log(`[Turn Process] TESTER spoke. Triggering autonomous Agent (Assistant: ${session.agentVersion.agent.name})...`);

                const { responseText, threadId, toolCalls } = await getAgentAssistantResponse(
                    session.agentVersion.agent.assistantId,
                    session.agentThreadId || null,
                    messageContent
                );

                console.log(`[Turn Process] Agent response received. Tool calls: ${toolCalls?.length || 0}`);

                // Update Session Thread
                await prisma.testSession.update({
                    where: { id: session.id },
                    data: { agentThreadId: threadId }
                });

                // Log Tool Calls if any
                if (toolCalls && toolCalls.length > 0) {
                    console.log(`[Turn Process] Logging ${toolCalls.length} tool calls for UI visibility...`);
                    for (const tc of toolCalls) {
                        const toolLogged = await prisma.messageLog.create({
                            data: {
                                sessionId: session.id,
                                sender: 'SYSTEM',
                                content: `🛠️ Tool Call: ${tc.name}`
                            }
                        });
                        await notifySocketServer('message', session.id, toolLogged);
                    }
                }

                // Log and Notify Agent Message
                const loggedMsg = await prisma.messageLog.create({
                    data: {
                        sessionId: session.id,
                        sender: 'AGENT',
                        content: responseText
                    }
                });
                await notifySocketServer('message', session.id, loggedMsg);

                // Send to WhatsApp
                try {
                    console.log(`[Turn Process] Delivering AGENT response to WhatsApp (${session.targetNumber})...`);
                    await sendWhatsAppMessage(session.targetNumber, responseText);
                    console.log(`[Turn Process] WhatsApp delivery SUCCESS`);
                } catch (whatsappError: any) {
                    console.error(`[Turn Process] WhatsApp delivery FAILED:`, whatsappError.message);
                }

                return NextResponse.json({ ok: true, action: 'agent_triggered' });
            }

            console.log(`[Turn Process] TESTER spoke. No autonomous agent found. Waiting for external AGENT response via Evolution API.`);
            return NextResponse.json({ ok: true, action: 'waiting_for_external_agent' });
        }

    } catch (error) {
        console.error("Internal Process Turn Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
