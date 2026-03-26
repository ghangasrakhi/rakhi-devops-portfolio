const Parser = require("rss-parser");
const { BlobServiceClient } = require("@azure/storage-blob");
const axios = require("axios");

const parser = new Parser();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

module.exports = async function (context, req) {
    const feedUrl = "https://medium.com/feed/@ghangas-rakhi";

    try {
        const response = await axios.get(feedUrl);
        const feed = await parser.parseString(response.data);

        if (!connectionString) throw new Error("Storage Connection String missing.");
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("medium-blobs");
        await containerClient.createIfNotExists();

        const posts = [];

        for (const item of feed.items) {
            const cleanLink = item.link.split('?')[0];
            context.log(`Fetching via Jina: ${item.title}`);

            let fullArticleText = "";
            try {
                // 1. THE JINA BYPASS: Simply prepend the Jina URL
                // This returns clean, full-text Markdown/Text automatically
                const jinaUrl = `https://r.jina.ai/${cleanLink}`;
                const jinaResponse = await axios.get(jinaUrl);
                
                fullArticleText = jinaResponse.data;

                // 2. SAFETY CHECK: If Jina fails or returns a short error, use RSS snippet
                if (!fullArticleText || fullArticleText.length < 500) {
                    context.log.warn(`Jina returned short content for ${item.title}, using snippet.`);
                    fullArticleText = item.contentSnippet || item.content;
                }
            } catch (e) {
                context.log.error(`Jina error for ${item.title}: ${e.message}`);
                fullArticleText = item.contentSnippet;
            }

            // 3. CLEANING: Remove extra whitespace and newlines for the Vector Indexer
            const cleanText = fullArticleText
                .replace(/\s+/g, ' ')      
                .trim();

            const blobName = `${item.guid.split('/').pop()}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            const blogData = JSON.stringify({
                title: item.title,
                link: cleanLink,
                chunk: cleanText, // This will now be the FULL article
                timestamp: item.pubDate,
                source: "Medium",
                syncDate: new Date().toISOString()
            });

            await blockBlobClient.upload(blogData, Buffer.byteLength(blogData), {
                blobHTTPHeaders: { blobContentType: "application/json" }
            });

            posts.push({ title: item.title, length: cleanText.length });
        }

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: posts
        };

    } catch (error) {
        context.log.error("Global Sync Error:", error.message);
        context.res = { status: 500, body: { error: error.message } };
    }
};
// const axios = require("axios");

// module.exports = async function (context, req) {
//     const apiKey = process.env.AZURE_OPENAI_KEY;
//     const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
//     const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    
//     const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
//     const searchKey = process.env.AZURE_SEARCH_KEY;
//     const searchIndex = "rag-1773919700779"; 

//     const userQuery = req.body ? req.body.query : null;

//     if (!userQuery) {
//         context.res = { status: 400, body: "What would you like to ask Rakhi?" };
//         return;
//     }

//     try {
//         const response = await axios.post(
//             `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-15-preview`,
//             {
//                 messages: [
//                     { 
//                         role: "system", 
//                         content: "You are a professional AI representing Rakhi, a DevOps & Cloud Engineer. Answer questions based on her Medium blogs. Always maintain a professional yet helpful tone." 
//                     },
//                     { role: "user", content: userQuery }
//                 ],
//                 data_sources: [
//                     {
//                         type: "azure_search",
//                         parameters: {
//                             endpoint: searchEndpoint,
//                             index_name: searchIndex,
//                             authentication: { type: "api_key", key: searchKey },
//                             query_type: "vectorSemanticHybrid", 
//                             semantic_configuration: "rag-1773919700779-semantic-configuration",
//                             fields_mapping: {
//                                 content_columns: ["chunk"], 
//                                 title_field: "title",       
//                                 url_field: "link", // Correctly mapped to Medium URL
//                                 vector_fields: ["text_vector"]
//                             },
//                             embedding_dependency: {
//                                 type: "deployment_name",
//                                 deployment_name: "text-embedding-3-small" 
//                             },
//                             strictness: 2,
//                             in_scope: true,
//                             top_n_documents: 5
//                         }
//                     }
//                 ]
//             },
//             {
//                 headers: { "api-key": apiKey, "Content-Type": "application/json" }
//             }
//         );

//         context.res = {
//             status: 200,
//             body: { reply: response.data.choices[0].message.content }
//         };
//     } catch (error) {
//         const azureError = error.response?.data?.error?.message || error.message;
//         context.log.error("RAG Error:", azureError);
//         context.res = { status: 500, body: { reply: `I'm having trouble accessing my blog history right now: ${azureError}` } };
//     }
// };

// const axios = require("axios");

// module.exports = async function (context, req) {
//     const apiKey = process.env.AZURE_OPENAI_KEY;
//     const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
//     const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    
//     const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
//     const searchKey = process.env.AZURE_SEARCH_KEY;
//     const searchIndex = "rag-1773919700779"; 

//     const userQuery = req.body ? req.body.query : null;

//     // EMERGENCY BYPASS: If you type "test", and this works, your connection is fine!
//     if (userQuery === "test") {
//         context.res = {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//             body: { reply: "DevOps Heartbeat: 100bpm. Connection is live!" }
//         };
//         return;
//     }

//     if (!userQuery) {
//         context.res = { status: 400, body: "Ask me anything about my DevOps journey!" };
//         return;
//     }

//     try {
//         const response = await axios.post(
//             `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-15-preview`,
//             {
//                 messages: [
//                     { role: "system", content: "You are an AI assistant for Rakhi's DevOps portfolio. Answer questions based on her Medium blogs and experience." },
//                     { role: "user", content: userQuery }
//                 ],
//                 data_sources: [
//                     {
//                         type: "azure_search",
//                         parameters: {
//                             endpoint: searchEndpoint,
//                             index_name: searchIndex,
//                             storage_account_connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING,
//                             authentication: {
//                                 type: "api_key",
//                                 key: searchKey
//                             },
//                             query_type: "vectorSemanticHybrid", // Upgraded to Hybrid Search
//                             // semantic_configuration: "default",
//                             semantic_configuration: "rag-1773919700779-semantic-configuration",
//                             fields_mapping: {
//                                 content_columns: ["chunk"], 
//                                 title_field: "title",       
//                                 url_field: "chunk_id",      
//                                 vector_fields: ["text_vector"]
//                             },
//                             // CRITICAL ADDITION:
//                             embedding_dependency: {
//                                 type: "deployment_name",
//                                 deployment_name: "text-embedding-3-small" 
//                             },
//                             strictness: 1, // Less restrictive to ensure an answer is found
//                             in_scope: true,
//                             top_n_documents: 5,
//                             role_information: "You are a professional assistant representing a DevOps engineer named Rakhi."
//                         }
//                     }
//                 ]
//             },
//             {
//                 headers: { "api-key": apiKey, "chatgpt-key": apiKey, "Content-Type": "application/json" }
//             }
//         );

//         context.res = {
//             status: 200,
//             body: { reply: response.data.choices[0].message.content }
//         };
//     } catch (error) {
//     // This will tell you if the Key is wrong or if the Deployment is missing
//     const azureError = error.response?.data?.error?.message || error.message;
//     context.log.error("Detailed Error:", azureError);
    
//     context.res = {
//         status: 500,
//         body: { reply: `RAG Error: ${azureError}` } 
//     };
//     }
// };