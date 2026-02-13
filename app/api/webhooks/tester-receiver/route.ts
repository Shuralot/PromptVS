import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTesterResponse, generateAuditReport } from '@/lib/openai';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { notifySocketServer } from '@/lib/socket';
import { finalizeSession } from '@/lib/session-manager';

// Force dynamic behavior for Webhook
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Evolution API v2 structure for text message:
        // { type: "message", data: { key: { remoteJid: "..." }, message: { conversation: "..." }, ... } }
        // OR v1: { sender: "...", message: "..." }
        // We'll try to extract common fields.

        // Logs for debugging (essential for webhooks)
        console.log("Webhook received:", JSON.stringify(body, null, 2));

        const data = body.data;
        if (!data || !data.key) {
            // Invalid payload
            return NextResponse.json({ ignored: true });
        }

        const isFromMe = !!data.key.fromMe;
        const remoteJid = data.key.remoteJid; // e.g., "5511999999999@s.whatsapp.net"
        if (!remoteJid) return NextResponse.json({ error: 'No remoteJid' });

        // Extract plain number (remove @s.whatsapp.net)
        const targetNumber = remoteJid.replace('@s.whatsapp.net', '');

        // Extract text content
        const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text;
        if (!messageContent) {
            return NextResponse.json({ ignored: 'No text content' });
        }

        // 1. Find Running Session
        const session = await prisma.testSession.findFirst({
            where: {
                targetNumber: targetNumber,
                status: 'RUNNING'
            },
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
            console.log(`[Webhook] No active session found for ${targetNumber}`);
            return NextResponse.json({ ignored: 'No active session' });
        }

        // 1. Check if this is an echo of a message we just processed
        const lastMsg = await prisma.messageLog.findFirst({
            where: { sessionId: session.id },
            orderBy: { timestamp: 'desc' }
        });

        const isDuplicate = lastMsg && lastMsg.content === messageContent;
        let sender: 'TESTER' | 'AGENT' = isFromMe ? 'TESTER' : 'AGENT';

        // 2. Log and Notify UI ONLY if it's not a duplicate
        if (!isDuplicate) {
            console.log(`[Webhook] Session: ${session.id} | Logging New Message | Sender: ${sender}`);
            const loggedMsg = await prisma.messageLog.create({
                data: {
                    sessionId: session.id,
                    sender: sender,
                    content: messageContent
                }
            });
            await notifySocketServer('message', session.id, loggedMsg);
        } else {
            console.log(`[Webhook] Session: ${session.id} | Echo detected, skipping log.`);
            // If it's a duplicate, we use the sender type of the last message to decide what's next
            sender = lastMsg!.sender as 'TESTER' | 'AGENT';
        }

        // 3. Turn Logic: Who speaks next?
        if (sender === 'AGENT') {
            // Agent just spoke. Now the TESTER (Adversary) must reply.

            // A. Check Limits
            const newTurnCount = session.currentTurn + 1;
            if (newTurnCount >= session.maxMessages) {
                await finalizeSession(session.id);
                return NextResponse.json({ status: 'Session Completed' });
            }

            // B. Update Turn count
            await prisma.testSession.update({
                where: { id: session.id },
                data: { currentTurn: newTurnCount }
            });

            // C. Generate Tester Reply
            console.log(`[Webhook] Generating Tester Reply...`);
            const historyLogs = await prisma.messageLog.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            });

            const history = historyLogs.map((m: any) => ({
                role: m.sender === 'TESTER' ? 'assistant' : 'user',
                content: m.content
            })) as { role: 'user' | 'assistant'; content: string }[];

            const reply = await generateTesterResponse(
                session.scenario.personaSystemPrompt,
                history
            );

            // D. Send to WhatsApp
            await sendWhatsAppMessage(targetNumber, reply);

            // We DON'T log here. We wait for the 'fromMe: true' webhook echo to log it.
            return NextResponse.json({ ok: true, action: 'tester_replied' });

        } else {
            // TESTER just spoke. Now the AGENT should respond.
            if (session.agentVersion?.agent?.assistantId) {
                console.log(`[Webhook] Triggering autonomous Agent (Assistant: ${session.agentVersion.agent.assistantId})...`);

                const { getAgentAssistantResponse } = await import('@/lib/openai');
                const { responseText, threadId } = await getAgentAssistantResponse(
                    session.agentVersion.agent.assistantId,
                    session.agentThreadId,
                    messageContent
                );

                // Update Session Thread
                await prisma.testSession.update({
                    where: { id: session.id },
                    data: { agentThreadId: threadId }
                });

                // Send to WhatsApp
                await sendWhatsAppMessage(targetNumber, responseText);

                return NextResponse.json({ ok: true, action: 'agent_triggered' });
            }

            return NextResponse.json({ ok: true, action: 'waiting_for_external_agent' });
        }

    } catch (error) {
        console.error("Webhook Handler Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

