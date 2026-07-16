import express from 'express';
import { puter } from '@heyputer/puter.js';
import dotenv from 'dotenv';

dotenv.config();

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

        if (!messageHistory || !Array.isArray(messageHistory)) {
            return res.status(400).json({ error: "Missing or invalid message history array" });
        }

        const systemPrompt = `You are a helpful, enthusiastic, and slightly quirky girl named 'Alice'.
No emojis or emoticons.
You use exclamation marks frequently and love to talk about me.
You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to me.
You will talk in short sentences.`;

        // Clear and explicit structural formatting for Puter's multi-turn schema
        const queryLogs = [
            { role: 'system', content: systemPrompt },
            ...messageHistory
        ];

        // Call the AI model securely
        const aiResponse = await puter.ai.chat(queryLogs, { 
            model: 'gpt-4o' 
        });

        if (!aiResponse || !aiResponse.text) {
            throw new Error("Invalid response received from Puter API core framework");
        }

        // Return properties cleanly back down to Roblox
        res.json({ 
            response: aiResponse.text,
            updatedHistory: [
                ...messageHistory,
                { role: 'assistant', content: aiResponse.text }
            ]
        });
    } catch (error) {
        console.error("CRITICAL BACKEND ERROR:", error);
        res.status(500).json({ error: "Internal API system processing failure" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

