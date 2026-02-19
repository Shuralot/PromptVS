const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", port: PORT }));
app.get("/", (req, res) => res.send("Socket Server Running"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this setup
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.SOCKET_INTERNAL_PORT || process.env.PORT || 4000;

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (Origin: ${socket.handshake.headers.origin})`);

    // Clients can join a room based on sessionId
    socket.on('join-session', (sessionId) => {
        if (sessionId) {
            socket.join(sessionId);
            console.log(`[Socket] ${socket.id} JOINED session ${sessionId}`);
        } else {
            console.warn(`[Socket] ${socket.id} tried to join invalid session`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Endpoint for backend to notify about new events
app.post('/notify', (req, res) => {
    const { sessionId, type, data } = req.body;

    if (!sessionId || !type) {
        return res.status(400).json({ error: 'Missing sessionId or type' });
    }

    // Emit to specific room (session)
    io.to(sessionId).emit(type, data);
    console.log(`[Socket] NOTIFICATION BROADCAST | Session: ${sessionId} | Type: ${type} | Data Size: ${JSON.stringify(data).length} bytes`);

    res.json({ success: true });
});

server.listen(PORT, () => {
    console.log(`Socket Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    console.log("[Socket Server] Received SIGTERM.");
    process.exit(0);
});
