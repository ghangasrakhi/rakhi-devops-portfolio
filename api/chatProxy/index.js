const axios = require("axios");

module.exports = async function (context, req) {
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = "rag-1773919700779"; 

    const userQuery = req.body ? req.body.query : null;

    if (!userQuery) {
        context.res = { status: 400, body: "What would you like to ask Rakhi?" };
        return;
    }

    try {
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-15-preview`,
            {
                messages: [
                    { 
                        role: "system", 
                        content: "You are a professional AI representing Rakhi, a DevOps & Cloud Engineer. Answer questions based on her Medium blogs. Always maintain a professional yet helpful tone." 
                    },
                    { role: "user", content: userQuery }
                ],
                data_sources: [
                    {
                        type: "azure_search",
                        parameters: {
                            endpoint: searchEndpoint,
                            index_name: searchIndex,
                            authentication: { type: "api_key", key: searchKey },
                            query_type: "vectorSemanticHybrid", 
                            semantic_configuration: "rag-1773919700779-semantic-configuration",
                            fields_mapping: {
                                content_columns: ["chunk"], 
                                title_field: "title",       
                                url_field: "link", // Correctly mapped to Medium URL
                                vector_fields: ["text_vector"]
                            },
                            embedding_dependency: {
                                type: "deployment_name",
                                deployment_name: "text-embedding-3-small" 
                            },
                            strictness: 2,
                            in_scope: true,
                            top_n_documents: 5
                        }
                    }
                ]
            },
            {
                headers: { "api-key": apiKey, "Content-Type": "application/json" }
            }
        );

        context.res = {
            status: 200,
            body: { reply: response.data.choices[0].message.content }
        };
    } catch (error) {
        const azureError = error.response?.data?.error?.message || error.message;
        context.log.error("RAG Error:", azureError);
        context.res = { status: 500, body: { reply: `I'm having trouble accessing my blog history right now: ${azureError}` } };
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