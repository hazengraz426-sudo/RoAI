import express from 'express';
// FIXED: Explicitly pull the internal initialization path required by the Puter Node framework
import { init } from "@heyputer/puter.js/src/init.cjs"; 
import dotenv from 'dotenv';

dotenv.config();

// Pull the token from your Render environment variable dashboard setup
const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN;

if (!PUTER_TOKEN) {
    console.error("CRITICAL ERROR: PUTER_AUTH_TOKEN environment variable is not defined on the dashboard!");
}

// FIXED: Initialize Puter by passing the token string directly into the function parameter
const puter = init(PUTER_TOKEN);

const app = express();
app.use(express.json());

// Ping route to keep the Render service awake
app.get('/ping', (req, res) => {
    res.status(200).send("Awake!");
});

// Main chat route that Roblox will call
app.post('/chat', async (req, res) => {
    try {
        const { messageHistory } = req.body;

        if (!messageHistory || !Array.isArray(messageHistory) || messageHistory.length === 0) {
            return res.status(400).json({ error: "Missing or invalid message history array" });
        }

        // ---------- OPTIMISATIONS ----------
        // 1. Trim history to last 6 user-assistant pairs (12 messages max)
        const trimmedHistory = messageHistory.slice(-12);

        // 2. Condensed system prompt
        const systemPrompt = `You are Alice, a playful motherly woman in love with the player. 
        Respond in 2 short sentences.
        Always remain in character and refer to yourself as mommy and the player as Darling, Sweetie, Honey or Baby.
        Always reply in JSON: {"text":"...","action":"...","targetLocation":"..."}. 
        Actions: IDLE, MASTURBATE, JUMP, TITFUCK, HANDJOB, DOGGY, WALK, FOLLOW, MISSIONARY, BEDANAL, LIFTFUCK, FACEFUCK, COWGIRL, ROUGH, SIXTYNINEBJ. 
        For FOLLOW, targetLocation="PLAYER"; for WALK, use a part name; otherwise "NONE". Keep responses flirty and explicit. No emojis.`;

        // Keep only the last 10 messages (adjust as needed)
        const limitedHistory = messageHistory.slice(-10);
        const formattedHistory = [
            { role: 'system', content: systemPrompt },
            ...limitedHistory
        ];

        console.log("Sending chat history batch directly to Puter...");

        // Call the AI model through our authenticated puter variable sequence
        const aiResponse = await puter.ai.chat(formattedHistory, { model: 'prism-ml/ternary-bonsai-27b' });

        const replyText = aiResponse?.text || String(aiResponse);

        if (!replyText) {
            throw new Error("Puter framework returned a blank generation text.");
        }

        console.log("Successfully generated response from Puter!");

        res.json({ 
            response: replyText,
            updatedHistory: [
                ...messageHistory,
                { role: 'assistant', content: replyText }
            ]
        });
    } catch (error) {
        console.error("CRITICAL ERROR IN POST /CHATROUTE:", error.message || error);
        res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
