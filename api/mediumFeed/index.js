const Parser = require("rss-parser");
const { BlobServiceClient } = require("@azure/storage-blob");
const parser = new Parser();

// Connect to storage (Ensure this matches your SWA Configuration key exactly)
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

module.exports = async function (context, req) {
    try {
        const feed = await parser.parseURL("https://medium.com/feed/@ghangas-rakhi");
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("medium-blobs");

        const posts = [];

        for (const item of feed.items) {
            // 1. Prepare data for Frontend
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

            // 2. Sync to Blob Storage for AI Search Indexer
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

            // Upload silently
            await blockBlobClient.upload(blogData, Buffer.byteLength(blogData), {
                blobHTTPHeaders: { blobContentType: "application/json" }
            });
        }

        // Return the array of posts so the website can show them!
        context.res = {
            status: 200,
            body: posts
        };

    } catch (error) {
        context.log.error("Error in mediumFeed:", error.message);
        context.res = {
            status: 500,
            body: { error: "Failed to sync/fetch blogs", details: error.message }
        };
    }
};