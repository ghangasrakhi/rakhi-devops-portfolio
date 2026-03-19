const axios = require('axios');

module.exports = async function (context, req) {
    const userQuery = req.body ? req.body.query : null;

    if (!userQuery) {
        context.res = {
            status: 400,
            body: "Please send a query in the request body."
        };
        return;
    }

    try {
        const response = await axios.post(
            `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o/extensions/chat/completions?api-version=2023-06-01-preview`,
            {
                dataSources: [
                    {
                        type: "AzureCognitiveSearch",
                        parameters: {
                            endpoint: process.env.AZURE_SEARCH_ENDPOINT,
                            key: process.env.AZURE_SEARCH_KEY,
                            indexName: "rag-1773919700779" // index 
                        }
                    }
                ],
                messages: [
                    { role: "system", content: "You are Rakhi's AI Assistant. You help recruiters understand her DevOps skills in Azure and Kubernetes." },
                    { role: "user", content: userQuery }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.AZURE_OPENAI_KEY
                }
            }
        );

        context.res = {
            body: { reply: response.data.choices[0].messages[1].content }
        };
    } catch (error) {
        context.log.error(error);
        context.res = { status: 500, body: "Cloud brain sync error." };
    }
};