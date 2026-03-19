const Parser = require("rss-parser");
const { BlobServiceClient } = require("@azure/storage-blob");
const axios = require("axios"); // Using axios to fetch the raw data first
const parser = new Parser();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

module.exports = async function (context, req) {
    const feedUrl = "https://medium.com/feed/@ghangas-rakhi";

    try {
        // 1. Fetch raw XML first to avoid "Invalid URL" parser quirks
        const response = await axios.get(feedUrl);
        const feed = await parser.parseString(response.data);

        // 2. Initialize Blob Storage
        if (!connectionString) {
            throw new Error("Storage Connection String is missing in Configuration.");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("medium-blobs");
        
        // Ensure container exists (Safe check for first-time deploy)
        await containerClient.createIfNotExists();

        const posts = [];

        for (const item of feed.items) {
            // Prepare frontend data
            let thumbnail = null;
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) thumbnail = imgMatch[1];

            posts.push({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                description: item.contentSnippet,
                thumbnail: thumbnail
            });

            // Sync to Blob Storage for AI Search
            const blobName = `${item.guid.split('/').pop()}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const cleanText = item.content.replace(/<[^>]*>?/gm, '');

            const blogData = JSON.stringify({
                title: item.title,
                link: item.link,
                chunk: cleanText, 
                timestamp: item.pubDate,
                source: "Medium"
            });

            await blockBlobClient.upload(blogData, Buffer.byteLength(blogData), {
                blobHTTPHeaders: { blobContentType: "application/json" }
            });
        }

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: posts
        };

    } catch (error) {
        context.log.error("Sync Error:", error.message);
        context.res = {
            status: 500,
            body: { 
                error: "Failed to sync/fetch blogs", 
                details: error.message,
                stack: error.stack // Helpful for debugging the first run
            }
        };
    }
};