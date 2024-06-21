# Vector Store Open AI
The example code uses a vector store for embedded model and gpt-4o OpenAI API

I use Indonesian EyD version 5 document as an example. EyD (Ejaan yang Disempurnakan) mean Improved Spelling for the Indonesian Language

## Install
Node version 20
```
pnpm install
```

## Run the code
```
node --env-file=.env index.cjs
```

### Vector Store Reference
Vector Store objects give the [File Search](https://platform.openai.com/docs/assistants/tools/file-search?lang=node.js) tool the ability to search your files. Adding a file to a vector_store automatically parses, chunks, embeds and stores the file in a vector database that's capable of both keyword and semantic search.

[https://platform.openai.com/docs/assistants/tools/file-search/vector-stores](https://platform.openai.com/docs/assistants/tools/file-search/vector-stores)

### Document Source
[https://badanbahasa.kemdikbud.go.id/resource/doc/files/SK_EYD_Edisi_V_16082022.pdf](https://badanbahasa.kemdikbud.go.id/resource/doc/files/SK_EYD_Edisi_V_16082022.pdf)