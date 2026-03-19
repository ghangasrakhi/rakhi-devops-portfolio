const Parser = require("rss-parser");
const { BlobServiceClient } = require("@azure/storage-blob");
const parser = new Parser();

// Connect to your storage account
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient("medium-blobs");

module.exports = async function (context, req) {
    try {
        const feed = await parser.parseURL("https://medium.com/feed/@ghangas-rakhi");
        
        // We will process each blog post
        for (const item of feed.items) {
            const blobName = `${item.guid.split('/').pop()}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Clean the content: Remove HTML tags so the AI sees pure text
            const cleanText = item.content.replace(/<[^>]*>?/gm, '');

            // Inside your for loop, make sure the field name is 'chunk' 
                // so the Indexer sees it automatically!
            const blogData = JSON.stringify({
                title: item.title,
                link: item.link,
                chunk: cleanText, // This matches your AI Search "content" mapping
                timestamp: item.pubDate,
                source: "Medium"
            });

            // Set the content type so Azure Search doesn't treat it as binary
            await blockBlobClient.upload(blogData, Buffer.byteLength(blogData), {
                blobHTTPHeaders: { blobContentType: "application/json" }
            });
        }

        context.res = { status: 200, body: "Blogs synced to Azure Storage successfully!" };
    } catch (error) {
        context.res = { status: 500, body: error.message };
    }
};


// const Parser = require("rss-parser");
// const parser = new Parser();

// module.exports = async function (context, req) {
//   try {

//     const feed = await parser.parseURL(
//       "https://medium.com/feed/@ghangas-rakhi"
//     );

//     const posts = feed.items.slice(0, 5).map(post => {

//       // extract image from content
//       let thumbnail = null;
//       const match = post.content.match(/<img[^>]+src="([^">]+)"/);

//       if (match && match[1]) {
//         thumbnail = match[1];
//       }

//       return {
//         title: post.title,
//         link: post.link,
//         pubDate: post.pubDate,
//         description: post.contentSnippet,
//         thumbnail: thumbnail
//       };
//     });

//     context.res = {
//       status: 200,
//       body: posts
//     };

//   } catch (error) {

//     context.res = {
//       status: 500,
//       body: {
//         error: "Failed to fetch Medium posts",
//         details: error.message
//       }
//     };
//   }
// };

