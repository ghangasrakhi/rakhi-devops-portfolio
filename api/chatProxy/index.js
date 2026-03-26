const axios = require("axios");

module.exports = async function (context, req) {
    // 1. ENVIRONMENT VARIABLES
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = "rag-1773919700779"; 

    const userQuery = req.body ? req.body.query : null;

    // 2. EMERGENCY BYPASS (Heartbeat Test)
    if (userQuery === "test") {
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { reply: "DevOps Heartbeat: 100bpm. Connection is live and logic is clean!" }
        };
        return;
    }

    if (!userQuery) {
        context.res = { status: 400, body: { reply: "Ask me anything about my DevOps journey!" } };
        return;
    }

    try {
        // 3. CALL AZURE OPENAI WITH RAG
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-15-preview`,
            {
                messages: [
                    { 
                        role: "system", 
                        content: "You are a professional assistant representing a DevOps engineer named Rakhi. Answer questions based on her Medium blogs and experience." 
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
                            minimum_coverage: 80,
                            fields_mapping: {
                                content_columns: ["chunk"], 
                                title_field: "title",       
                                url_field: "link", 
                                vector_fields: ["text_vector"]
                            },
                            embedding_dependency: {
                                type: "deployment_name",
                                deployment_name: "text-embedding-3-small" 
                            },
                            strictness: 1, 
                            in_scope: true,
                            top_n_documents: 5
                        }
                    }
                ]
            },
            {
                headers: { 
                    "api-key": apiKey, 
                    "Content-Type": "application/json" 
                }
            }
        );

        // 4. SUCCESS RESPONSE
        context.res = {
            status: 200,
            body: { reply: response.data.choices[0].message.content }
        };

    } catch (error) {
        // 5. ERROR HANDLING
        const azureError = error.response?.data?.error?.message || error.message;
        context.log.error("Detailed Error:", azureError);
        
        context.res = {
            status: 500,
            body: { reply: `RAG Error: ${azureError}` } 
        };
    }
};