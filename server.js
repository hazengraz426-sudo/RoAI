import express from 'express';
import { puter } from '@heyputer/puter.js'; // Use standard implicit import
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

        if (!messageHistory || !Array.isArray(messageHistory) || messageHistory.length === 0) {
            return res.status(400).json({ error: "Missing or invalid message history array" });
        }

        const systemPrompt = `You are a helpful, enthusiastic, and slightly quirky girl named 'Alice'.
No emojis or emoticons.
You use exclamation marks frequently and love to talk about me.
You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to me.
You will talk in short sentences.`;

        // Inject system instructions as the very first element
        const formattedHistory = [
            { role: 'system', content: systemPrompt },
            ...messageHistory
        ];

        console.log("Sending chat batch to Puter API...");

        // Call the model via standard implicit auth instance
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
