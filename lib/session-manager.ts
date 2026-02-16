import { prisma } from './prisma';
import { generateAuditReport } from './openai';
import { notifySocketServer } from './socket';

export async function finalizeSession(sessionId: string) {
    console.log(`[SessionManager] Finalizing session: ${sessionId}`);

    const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
        include: { scenario: true }
    });

    if (!session) return;

    const allMessages = await prisma.messageLog.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' }
    });

    // 1. Update Status
    await prisma.testSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' }
    });

    await notifySocketServer('session-update', session.id, { status: 'COMPLETED' });

    // 2. Calculate Metrics
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 0; i < allMessages.length - 1; i++) {
        const current = allMessages[i];
        const next = allMessages[i + 1];
        if (current.sender === 'TESTER' && next.sender === 'AGENT') {
            const diffMs = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
            totalResponseTime += diffMs;
            responseCount++;
        }
    }

    const avgResponseTimeSeconds = responseCount > 0 ? (totalResponseTime / responseCount / 1000).toFixed(2) : "0";
    const transcript = allMessages.map((m: any) => ({
        sender: m.sender === 'TESTER' ? 'RAGNAR' : m.sender,
        content: m.content,
        timestamp: m.timestamp
    }));

    // 3. Generate Report
    try {
        const { analysis, usedPrompt } = await generateAuditReport(session.scenario.description, transcript);

        const finalAnalysis = {
            ...analysis,
            rawAnalysis: {
                ...(analysis.rawAnalysis || {}),
                ...analysis, // Save everything
                avgResponseTimeSeconds,
                totalMessages: allMessages.length
            }
        };

        await prisma.testReport.create({
            data: {
                sessionId: session.id,
                score: finalAnalysis.score || 0,
                summary: finalAnalysis.summary || null, // Optional now
                strengths: finalAnalysis.strengths || null, // Optional now
                weaknesses: finalAnalysis.weaknesses || null, // Optional now
                suggestions: finalAnalysis.suggestions || null, // Optional now
                rawAnalysis: finalAnalysis.rawAnalysis as any,
                usedPrompt: usedPrompt
            }
        });

        await notifySocketServer('session-update', session.id, { status: 'REPORT_READY' });
    } catch (err) {
        console.error(`[SessionManager] Failed to generate report for ${sessionId}:`, err);
        await notifySocketServer('session-update', session.id, { status: 'REPORT_FAILED' });
    }
}
