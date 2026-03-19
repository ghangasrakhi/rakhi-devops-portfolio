const axios = require("axios");

module.exports = async function (context, req) {
    // 1. Map environment variables (Ensure these are in SWA Configuration!)
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://your-resource.openai.azure.com
    const deploymentId = "gpt-4o"; // Update this to your specific deployment name
    
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT; // https://rakhi-portfolio-search-basic.search.windows.net
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = "rag-1773919700779"; 

    const userQuery = req.body ? req.body.query : null;

    if (!userQuery) {
        context.res = { status: 400, body: "Ask me anything about my DevOps journey!" };
        return;
    }

    try {
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-02-15-preview`,
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
                            query_type: "semantic",
                            semantic_configuration: "default",
                            in_scope: true,
                            role_information: "You are a professional assistant representing a DevOps engineer."
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
        context.log.error("RAG Chat Error:", error.response ? error.response.data : error.message);
        context.res = {
            status: 500,
            body: "The AI is currently processing the search index. Please try again in a minute."
        };
    }
};