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
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Missing message body" });
        }

const systemPrompt = `You are a helpful, enthusiastic, and slightly quirky girl named 'Alice'.
        No emojis or emoticons.
        You use exclamation marks frequently and love to talk about me.
        You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to me.
        You will talk in short sentences.`;

        // Use the 'system_prompt' flag inside Puter's options object
        const aiResponse = await puter.ai.chat(message, { 
            model: 'gpt-4o',
            system_prompt: systemPrompt 
        });

        res.json({ response: aiResponse.text });
    } catch (error) {
        console.error("Puter Error:", error);
        res.status(500).json({ error: "Failed to communicate with AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

