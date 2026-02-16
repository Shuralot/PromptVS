const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.WEBHOOK_SERVICE_PORT || 5001;
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:3000";

app.use(cors());
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const eventType = body.event;
    const data = body.data;

    if (eventType !== 'messages.upsert') return res.json({ ignored: 'event_type' });
    if (!data || !data.key) return res.json({ ignored: 'payload_structure' });

    const remoteJid = data.key.remoteJid;
    const isFromMe = !!data.key.fromMe;
    const msgId = data.key.id;

    if (!remoteJid || !remoteJid.endsWith('@s.whatsapp.net')) {
      return res.json({ ignored: 'not_individual_chat' });
    }

    // --- 1. Content Extraction (Hyper-Robust) ---
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.extendedTextMessage?.displayName || // Fallback for some API versions
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      data.message?.buttonsResponseMessage?.selectedButtonId ||
      data.message?.listResponseMessage?.title ||
      ""
    ).trim();

    if (!messageContent) {
      console.log(`[Webhook] No content in msg ${msgId} from ${remoteJid}`);
      // Log part of message structure to help debug if it's a new type
      console.log(`[Webhook] Message Structure: ${JSON.stringify(data.message).slice(0, 100)}...`);
      return res.json({ ignored: 'no_content' });
    }

    // --- 2. Session Match ---
    const recentSessions = await prisma.testSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const cleanRemote = remoteJid.replace(/\D/g, '');
    const session = recentSessions.find(s => {
      if (!s.targetNumber) return false;
      const cleanTarget = s.targetNumber.replace(/\D/g, '');
      if (cleanTarget.length < 5) return false;

      // Contains match
      if (cleanRemote.includes(cleanTarget) || cleanTarget.includes(cleanRemote)) return true;
      // Suffix match (8 digits)
      const rSuffix = cleanRemote.slice(-8);
      const tSuffix = cleanTarget.slice(-8);
      return rSuffix === tSuffix && rSuffix.length === 8;
    });

    if (!session) {
      console.log(`[Webhook] No session matched for JID: ${remoteJid} (Clean: ${cleanRemote})`);
      return res.json({ ignored: 'no_session' });
    }

    // --- 3. Deduplication ---
    const sender = isFromMe ? "TESTER" : "AGENT";
    const lastMsg = await prisma.messageLog.findFirst({
      where: { sessionId: session.id },
      orderBy: { timestamp: "desc" },
    });

    const isDuplicate = lastMsg && 
                       lastMsg.content === messageContent && 
                       lastMsg.sender === sender;

    if (isDuplicate) {
      console.log(`[Webhook] Duplicate ignored for Session ${session.id.slice(0,8)} (${sender})`);
      return res.json({ ok: true, detail: 'duplicate' });
    }

    // --- 4. Persist and Notify ---
    console.log(`[Webhook] SUCCESS | Session: ${session.id.slice(0,8)} | From: ${sender} | Msg: "${messageContent.slice(0,30)}..."`);
    
    const loggedMsg = await prisma.messageLog.create({
      data: {
        sessionId: session.id,
        sender: sender,
        content: messageContent,
      },
    });

    notifySocketServer("message", session.id, loggedMsg);

    // --- 5. Next Turn ---
    try {
      axios.post(
        `${MAIN_APP_URL}/api/internal/process-turn`,
        { sessionId: session.id, sender, messageContent },
        { headers: { "x-internal-key": process.env.INTERNAL_API_KEY || "secret" } }
      ).catch(e => console.error(`[Webhook] Turn trigger failed:`, e.message));
    } catch (err) {}

    return res.json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Internal Error:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

async function notifySocketServer(type, sessionId, data) {
  try {
    const socketServerUrl =
      process.env.SOCKET_SERVER_URL || "http://localhost:4000";
    await axios.post(`${socketServerUrl}/notify`, {
      type,
      sessionId,
      data,
    });
  } catch (error) {
    console.error(
      "[Webhook Service] Failed to notify socket server:",
      error.message,
    );
  }
}

app.listen(PORT, () => {
  console.log(`[Webhook Service] Running on port ${PORT}`);
});
