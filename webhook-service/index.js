const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.WEBHOOK_INTERNAL_PORT || process.env.PORT || 5001;
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:3000";

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok", port: PORT }));
app.get("/", (req, res) => res.send("Webhook Service Running"));

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const eventType = body.event;
    const data = body.data;

    // --- Enhanced Logging ---
    console.log(`[Webhook] INCOMING: ${eventType}`);
    console.log(`[Webhook] PAYLOAD: ${JSON.stringify(data || {}, null, 2).slice(0, 500)}...`); // Truncate to avoid spam

    if (eventType !== 'messages.upsert') {
      console.log(`[Webhook] Ignored event type: ${eventType}`);
      return res.json({ ignored: 'event_type' });
    }
    if (!data || !data.key) {
      console.log(`[Webhook] Ignored invalid payload structure`);
      return res.json({ ignored: 'payload_structure' });
    }

    const remoteJid = data.key.remoteJid;
    const isFromMe = !!data.key.fromMe;
    const msgId = data.key.id;

    if (!remoteJid || !remoteJid.endsWith('@s.whatsapp.net')) {
      return res.json({ ignored: 'not_individual_chat' });
    }

    // --- 1. Content Extraction (Hyper-Robust) ---
    console.log(`[Webhook] Processing event ${eventType} for msg ${msgId}`);
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.extendedTextMessage?.displayName || 
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      data.message?.buttonsResponseMessage?.selectedButtonId ||
      data.message?.listResponseMessage?.title ||
      ""
    ).trim();

    if (!messageContent) {
      console.log(`[Webhook] EXCLUDED: No text content found in message structure. JID: ${remoteJid}`);
      return res.json({ ignored: 'no_content' });
    }

    // --- 2. Session Match ---
    const recentSessions = await prisma.testSession.findMany({
      where: { status: 'RUNNING' },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const cleanRemote = remoteJid.replace(/\D/g, '');
    console.log(`[Webhook] Looking for session for JID: ${remoteJid} (Clean: ${cleanRemote}) in ${recentSessions.length} active sessions`);

    const session = recentSessions.find(s => {
      if (!s.targetNumber) return false;
      const cleanTarget = s.targetNumber.replace(/\D/g, '');
      if (cleanTarget.length < 5) return false;

      const isMatch = cleanRemote.includes(cleanTarget) || cleanTarget.includes(cleanRemote);
      if (isMatch) return true;

      const rSuffix = cleanRemote.slice(-8);
      const tSuffix = cleanTarget.slice(-8);
      return rSuffix === tSuffix && rSuffix.length === 8;
    });

    if (!session) {
      console.log(`[Webhook] EXCLUDED: No active session matched for JID: ${remoteJid}. Available targets: ${recentSessions.map(rs => rs.targetNumber).join(', ')}`);
      return res.json({ ignored: 'no_session' });
    }

    console.log(`[Webhook] MATCHED Session: ${session.id.slice(0,8)} | Target: ${session.targetNumber}`);

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
      console.log(`[Webhook] EXCLUDED: Duplicate message detected for session ${session.id.slice(0,8)}`);
      return res.json({ ok: true, detail: 'duplicate' });
    }

    // --- 4. Persist and Notify ---
    console.log(`[Webhook] SUCCESS | Session: ${session.id.slice(0,8)} | From: ${sender} | Msg: "${messageContent.slice(0,40)}..."`);
    
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
      console.log(`[Webhook] Triggering internal turn process for session ${session.id.slice(0,8)}...`);
      axios.post(
        `${MAIN_APP_URL}/api/internal/process-turn`,
        { sessionId: session.id, sender, messageContent },
        { headers: { "x-internal-key": process.env.INTERNAL_API_KEY || "secret" } }
      ).then(resp => {
        console.log(`[Webhook] Turn trigger SUCCESS: ${JSON.stringify(resp.data)}`);
      }).catch(e => {
        console.error(`[Webhook] Turn trigger FAILED:`, e.response?.data || e.message);
      });
    } catch (err) {
      console.error(`[Webhook] Critical error triggering turn:`, err.message);
    }

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

process.on("SIGTERM", () => {
  console.log("[Webhook Service] Received SIGTERM. This usually means Easypanel killed the container via Health Check.");
  process.exit(0);
});
