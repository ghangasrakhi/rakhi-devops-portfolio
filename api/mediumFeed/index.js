const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const Parser = require("rss-parser");
const parser = new Parser();
const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;

const searchEndpoint = "https://medium-chatsearch.search.windows.net";
const indexName = "medium-blogs";
const apiKey = AZURE_SEARCH_KEY;

const searchClient = new SearchClient(searchEndpoint, indexName, new AzureKeyCredential(apiKey));

module.exports = async function(context, req) {
    const mediumRSS = "https://medium.com/feed/ghangas-rakhi";
    try {
        const feed = await parser.parseURL(mediumRSS);
        const posts = feed.items.slice(0, 6).map(item => ({
            id: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            thumbnail: item.enclosure ? item.enclosure.url : "https://example.com/default.jpg",
            content: item.contentSnippet || ""
        }));

        // Push to Azure AI Search
        const result = await searchClient.uploadDocuments(posts);
        context.log("Indexed posts:", result);

        context.res = {
            headers: { "Content-Type": "application/json" },
            body: posts
        };
    } catch(err) {
        context.res = { status: 500, body: { error: "Failed to fetch Medium posts", details: err.message } };
    }
};