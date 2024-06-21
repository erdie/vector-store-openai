// utils.js
const fs = require('fs');
const encoder = new TextEncoder();
const RATE_LIMIT_DELAY = 100;

async function chunkAndEmbedText(filePath, openai, chunkSize = 8191) {
    const text = fs.readFileSync(filePath, 'utf-8');
    const encoded = encoder.encode(text);
    const chunks = [];
    for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        chunks.push(new TextDecoder().decode(chunk));
    }

    const embeddingPromises = chunks.map(async (chunk, index) => {
        try {
            // Introduce a delay before each request
            await new Promise(resolve => setTimeout(resolve, index * RATE_LIMIT_DELAY));

            const embeddingResponse = await openai.embeddings.create({
                input: chunk,
                model: "text-embedding-ada-002",
            });
            return {
                text: chunk,
                embedding: embeddingResponse.data[0].embedding,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    return await Promise.all(embeddingPromises);
}

module.exports = { chunkAndEmbedText };