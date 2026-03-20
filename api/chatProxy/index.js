const axios = require("axios");

module.exports = async function (context, req) {
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentId = "gpt-4o";
    
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = "rag-1773919700779"; 

    const userQuery = req.body ? req.body.query : null;

    if (!userQuery) {
        context.res = { status: 400, body: "Ask me anything about my DevOps journey!" };
        return;
    }

    try {
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-01`,
            {
                messages: [
                    { role: "system", content: "You are an AI assistant for Rakhi's DevOps portfolio. Answer questions based on her Medium blogs and experience." },
                    { role: "user", content: userQuery }
                ],
                data_sources: [
                    {
                        type: "azure_search",
                        parameters: {
                            endpoint: searchEndpoint,
                            index_name: searchIndex,
                            authentication: {
                                type: "api_key",
                                key: searchKey
                            },
                            query_type: "vector_semantic", // Upgraded to Hybrid Search
                            semantic_configuration: "default",
                            fields_mapping: {
                                content_columns: ["chunk"],
                                title_field: "title",
                                url_field: "link"
                            },
                            // CRITICAL ADDITION:
                            embedding_dependency: {
                                type: "deployment_name",
                                deployment_name: "text-embedding-3-small" 
                            },
                            strictness: 2, // Less restrictive to ensure an answer is found
                            in_scope: true,
                            top_n_documents: 3,
                            role_information: "You are a professional assistant representing a DevOps engineer named Rakhi."
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
        // Detailed logging for debugging
        context.log.error("RAG Chat Error Detail:", JSON.stringify(error.response ? error.response.data : error.message));
        context.res = {
            status: 500,
            body: "The AI is refining its search. Please try again in a moment."
        };
    }
};