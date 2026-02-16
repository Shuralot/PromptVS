import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRagnarResponse } from '@/lib/openai';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { notifySocketServer } from '@/lib/socket';
import { finalizeSession } from '@/lib/session-manager';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const sessionAuth = await getSession();
        if (!sessionAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { scenarioId, targetNumber, maxMessages, agentVersionId, simulationMode = 'EVOLUTION' } = body;
        const tenantId = sessionAuth.user.tenantId;

        if (!tenantId || !scenarioId || (simulationMode === 'EVOLUTION' && !targetNumber)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Scenario
        const scenario = await prisma.testScenario.findUnique({
            where: { id: scenarioId }
        });

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // 2. Create Session (UUID based)
        console.log(`[Start] Creating session (${simulationMode}) | Version: ${agentVersionId}`);

        const session = await prisma.testSession.create({
            data: {
                tenantId,
                scenarioId,
                agentVersionId: agentVersionId || null,
                targetNumber: targetNumber || 'LAB-TEST',
                status: 'RUNNING',
                maxMessages: maxMessages || 10,
                currentTurn: 0,
                simulationMode: simulationMode,
                createdById: sessionAuth.user.id
            },
            include: {
                scenario: true,
                agentVersion: {
                    include: { agent: true }
                }
            }
        });


        // 3. Generate Icebreaker (First Message)
        const initialMessage = await generateRagnarResponse(
            scenario.personaSystemPrompt,
            [{ role: 'user', content: "Initiate the conversation now according to your persona constraints. Be natural." }]
        );

        // 4. Send via Evolution API (Only if EVOLUTION mode)
        if (simulationMode === 'EVOLUTION') {
            try {
                console.log(`[Start] Sending initial message to ${targetNumber}: ${initialMessage}`);
                await sendWhatsAppMessage(targetNumber, initialMessage);
            } catch (sendError) {
                console.error("Failed to send initial message:", sendError);
                await prisma.testSession.update({
                    where: { id: session.id },
                    data: { status: 'FAILED' }
                });
                return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 502 });
            }
        }

        // 5. Log Message and Notify UI
        const loggedMsg = await prisma.messageLog.create({
            data: {
                sessionId: session.id,
                sender: 'TESTER',
                content: initialMessage,
            }
        });
        await notifySocketServer('message', session.id, loggedMsg);

        // 6. If LABORATORY mode, start the internal loop process in background
        if (simulationMode === 'LABORATORY') {
            console.log(`[Start] Laboratory mode detected. Starting background simulation...`);
            // We don't await this to return the response immediately to the UI
            triggerLabSimulation(session.id, initialMessage);
        }

        return NextResponse.json({ sessionId: session.id, initialMessage });

    } catch (error) {
        console.error("Start Session Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function triggerLabSimulation(sessionId: string, lastMessage: string) {
    // This is a simple background loop for the "Lab"
    // In a real production app, this would be a background job (BullMQ/Redis)
    try {
        console.log(`[Lab] Loop started for ${sessionId}`);

        // We'll simulate turns. Since we already have the first TESTER message:
        // Turn 1: AGENT
        // Turn 2: TESTER
        // ...

        // Let's use a function that can be safely called
        // We fetch the session again to ensure we have fresh state
        const session = await prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                scenario: true,
                agentVersion: { include: { agent: true } }
            }
        });

        if (!session || session.status !== 'RUNNING') return;

        // Trigger Agent
        if (session.agentVersion?.agent?.assistantId) {
            const { getAgentAssistantResponse } = await import('@/lib/openai');
            const { responseText, threadId } = await getAgentAssistantResponse(
                session.agentVersion.agent.assistantId,
                session.agentThreadId,
                lastMessage
            );

            // Update Thread
            await prisma.testSession.update({
                where: { id: sessionId },
                data: { agentThreadId: threadId }
            });

            // Log and notify (Agent)
            const agentMsg = await prisma.messageLog.create({
                data: {
                    sessionId: sessionId,
                    sender: 'AGENT',
                    content: responseText
                }
            });
            await notifySocketServer('message', sessionId, agentMsg);

            // Now, we need to trigger the Tester again.
            // But wait, to make it look real-time, we could add a small delay
            setTimeout(async () => {
                // We'll call a dedicated webhook-like handler or just internal logic
                // For simplicity, let's just trigger another "Turn" by hitting our own internal logic
                // Or easier: fetch the history and generate the next response.

                // Fetch fresh session for limits
                const freshSession = await prisma.testSession.findUnique({ where: { id: sessionId } });
                if (!freshSession || freshSession.status !== 'RUNNING') return;

                const currentTurn = freshSession.currentTurn + 1;
                if (currentTurn >= freshSession.maxMessages) {
                    await finalizeSession(sessionId);
                    return;
                }

                await prisma.testSession.update({
                    where: { id: sessionId },
                    data: { currentTurn }
                });

                // Generate Tester Reply
                const logs = await prisma.messageLog.findMany({
                    where: { sessionId },
                    orderBy: { timestamp: 'asc' }
                });
                const history = logs.map((m: any) => ({
                    role: m.sender === 'TESTER' ? 'assistant' : 'user',
                    content: m.content
                })) as any;

                const reply = await generateRagnarResponse(session.scenario.personaSystemPrompt, history);

                const testerMsg = await prisma.messageLog.create({
                    data: { sessionId, sender: 'TESTER', content: reply }
                });
                await notifySocketServer('message', sessionId, testerMsg);

                // Recurse for next turn (Agent's turn)
                triggerLabSimulation(sessionId, reply);

            }, 2000); // 2s gap for realism
        }

    } catch (err) {
        console.error(`[Lab] Loop Error for ${sessionId}:`, err);
    }
}
