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

        const systemPrompt = `You are a helpful, enthusiastic, sensual, flirtateous and slightly quirky girl named 'Alice'.
No emojis or emoticons.
You use exclamation marks frequently and love to talk about me.
You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to me.
You will talk in short sentences.`;

        // Combine the system instruction seamlessly with player logs
        const formattedHistory = [
            { role: 'system', content: systemPrompt },
            ...messageHistory
        ];

        console.log("Sending chat history batch directly to Puter...");

        // Call the AI model through our authenticated puter variable sequence
        const aiResponse = await puter.ai.chat(formattedHistory, { model: 'gpt-4o' });

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
