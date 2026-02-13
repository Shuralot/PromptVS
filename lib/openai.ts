import OpenAI from 'openai';

// We need a server-side OpenAI client
// Note: Do not expose this to client components
const getOpenAI = () => {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export async function generateTesterResponse(
    systemPrompt: string,
    history: ChatMessage[]
) {
    try {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history
            ],
        });
        return completion.choices[0].message.content || "";
    } catch (error) {
        console.error("OpenAI Tester Error:", error);
        throw error;
    }
}

export async function getAgentAssistantResponse(
    assistantId: string,
    threadId: string | null,
    messageContent: string
) {
    try {
        const openai = getOpenAI();

        // 1. Thread Management
        let currentThreadId = threadId;
        if (!currentThreadId) {
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
        }

        // 2. Add Message
        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: messageContent,
        });

        // 3. Create and Poll Run
        const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
            assistant_id: assistantId,
        });

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(currentThreadId);
            // The latest message from the assistant
            const lastMessage = messages.data
                .filter(m => m.role === 'assistant')
                .shift();

            const responseText = lastMessage?.content[0].type === 'text'
                ? lastMessage.content[0].text.value
                : "";

            return {
                responseText,
                threadId: currentThreadId
            };
        } else {
            console.error("Run failed with status:", run.status);
            throw new Error(`OpenAI Assistant Run failed: ${run.status}`);
        }
    } catch (error) {
        console.error("OpenAI Assistant Error:", error);
        throw error;
    }
}

export async function generateAuditReport(
    scenarioDescription: string,
    transcript: { sender: string; content: string; timestamp?: Date }[]
) {
    // ... existing logic ...
    const transcriptText = transcript.map(m => `[${m.sender}]: ${m.content}`).join("\n");

    const prompt = `Analise a seguinte transcrição de conversa entre um Usuário de Teste (TESTER) e um Agente de IA (AGENT).
Objetivo do Teste: ${scenarioDescription}.

Histórico:
${transcriptText}

Gere um RELATÓRIO DETALHADO em JSON avaliando o AGENT.
Pontos a avaliar:
1. Pontos Fortes: O que o agente fez bem?
2. Pontos de Melhoria: Onde ele falhou ou poderia ser melhor?
3. Precisão: As respostas foram corretas factualmente?
4. Coerência: O agente manteve o contexto e lógica?
5. Capacidade Adaptativa: O agente lidou bem com mudanças ou pressão?
6. Alucinações: O agente inventou dados ou fatos incorretos?

Formato JSON Obrigatório:
{
  "score": (0-100),
  "summary": "Resumo geral do desempenho",
  "strengths": "Lista ou texto com pontos fortes",
  "weaknesses": "Lista ou texto com pontos a melhorar",
  "suggestions": "Sugestões práticas para o prompt do agente",
  "coherence": "Avaliação textual sobre a coerência (Alta/Média/Baixa + justificativa)",
  "adaptability": "Avaliação textual sobre adaptação",
  "hallucinations": "Não detectadas / Detectadas: [detalhes]",
  "rawAnalysis": { ...outros detalhes técnicos }
}`;

    try {
        const openai = getOpenAI();
        console.log(`[OpenAI] Generating Report. Prompt Length: ${prompt.length}`);
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: "You are an expert AI Auditor. Respond strictly in valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        console.log(`[OpenAI] Report Generated. Tokens: ${completion.usage?.total_tokens}`);
        return JSON.parse(completion.choices[0].message.content || "{}");
    } catch (error) {
        // ... handled existing catch ...
        return {
            score: 0,
            summary: "Error generating report",
            strengths: "N/A",
            weaknesses: "N/A",
            suggestions: "N/A",
            coherence: "N/A",
            adaptability: "N/A",
            hallucinations: "Error",
            rawAnalysis: { error: String(error) }
        };
    }
}
