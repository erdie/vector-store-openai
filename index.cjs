const OpenAI = require("openai");
const fs = require("fs");
const { chunkAndEmbedText } = require("./utils"); 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

// 1. Create an assistant
async function createAssistant() {
    const assistant = await openai.beta.assistants.create({
        name: "Koreksi Kata Berdasarkan EYD",
        instructions: "Berdasarkan dokumen EYD edisi V, coba perbaiki kesalahan ejaan dari kalimat berikut:",
        tools: [{ type: "file_search" }],
        model: "gpt-4-1106-preview",
    });
    return assistant;
  }

// 2. Create a vector store and upload files
async function createVectorStoreAndUploadFiles(assistantId, filePaths, openaiClient) { 
    try {
        // Upload the file (using the latest OpenAI API)
        const response = await openai.files.create({
            file: fs.createReadStream(filePaths[0]),
            purpose: "assistants"
        });

        console.log("File upload response:", response); // Check the response object for errors or success

        if (!response || !response.id) {
            throw new Error("File upload failed or did not return a file ID.");
        }

        const fileId = response.id;

        // Create the vector store (using the latest OpenAI API)
        const vectorStoreResponse = await openai.beta.vectorStores.create({
            name: "EYD_VectorStore",
            file_ids: [fileId] // Use file_ids (plural) with an array
        });

        console.log("Vector store response:", vectorStoreResponse);

        const vectorStoreId = vectorStoreResponse.id; 
        
        const textChunks = await chunkAndEmbedText(filePaths[0], openaiClient);
        await Promise.all(textChunks.map(async chunk => {
            await openaiClient.embeddings.create({ // Use openai.embeddings.create
                input: chunk.text,
                model: "text-embedding-ada-002",
                vector_store_id: vectorStoreId
            });
        }));

        return vectorStoreId; 
    } catch (error) {
        console.error("Error creating vector store and uploading files:", error); 
        throw error; 
    }
}

// 3. Update the assistant to use the new vector store
async function updateAssistant(assistantId, vectorStoreId) {
    try {
        await openai.beta.assistants.update(assistantId, {
            tools: [
                { 
                    type: "file_search" 
                }
            ],
            file_ids: [vectorStoreId]  // Pass vectorStoreId directly as part of the update
        });
    } catch (error) {
        console.error("Error updating assistant:", error);
        throw error;
    }
}
  

// 4. Create a thread
async function createThread(fileContent) {
    const thread = await openai.beta.threads.create({
        messages: [{
            role: "user",
            content: fileContent
        }]
    });
    return thread;
}

// 5. Run the assistant with file search on the thread
async function runAssistant(threadId, assistantId) {
    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Retrieve the messages after the run completes
    const messages = await openai.beta.threads.messages.list(threadId);

    // Assuming the assistant's reply is the last message in the thread
    const assistantReply = messages.data[0].content[0].text;

    console.log("Assistant:", assistantReply);
}

async function main() {
    const assistant = await createAssistant();
    const filePaths = ["eyd-v5.pdf"]; 
    const vectorStoreId = await createVectorStoreAndUploadFiles(assistant.id, filePaths, openai);
    await updateAssistant(assistant.id, vectorStoreId); 

    const userInput = "saya harap timnas bisa menggolkan lima puluh gol di final";
    const thread = await createThread(userInput);
    await runAssistant(thread.id, assistant.id); 
}

main();

