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

        if (!connectionString) {
            throw new Error("Storage Connection String is missing.");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("medium-blobs");
        await containerClient.createIfNotExists();

        const posts = [];

        for (const item of feed.items) {
            context.log(`Processing: ${item.title}`);

            // FIX 1: Use Jina to bypass the "Snippet Only" block
            // This ensures your AI has the FULL text, not just a preview.
            const cleanLink = item.link.split('?')[0];
            let fullArticleText = "";
            
            try {
                const jinaUrl = `https://r.jina.ai/${cleanLink}`;
                const jinaResponse = await axios.get(jinaUrl);
                fullArticleText = jinaResponse.data;
            } catch (e) {
                context.log.error(`Jina failed for ${item.title}: ${e.message}`);
                fullArticleText = item.contentSnippet || item.content;
            }

            const cleanText = fullArticleText
                .replace(/\s+/g, ' ')      
                .replace(/&nbsp;/g, ' ')
                .trim();

            let thumbnail = null;
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) thumbnail = imgMatch[1];

            // FIX 2: Standardize the Date Format to ISO
            // This is the ONLY way to fix the "Invalid Date" on your frontend.
            const isoTimestamp = new Date(item.pubDate).toISOString();

            const postEntry = {
                title: item.title,
                link: cleanLink,
                pubDate: isoTimestamp, 
                description: item.contentSnippet, 
                thumbnail: thumbnail
            };
            posts.push(postEntry);

            const blobName = `${item.guid.split('/').pop()}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // FIX 3: Ensure the JSON field matches your Azure Index "timestamp"
            const blogData = JSON.stringify({
                title: item.title,
                link: cleanLink,
                chunk: cleanText, 
                timestamp: isoTimestamp, // Matches your Index field name
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
            body: { error: "Failed to sync blogs", details: error.message }
        };
    }
};


// const Parser = require("rss-parser");
// const { BlobServiceClient } = require("@azure/storage-blob");
// const axios = require("axios");
// const cheerio = require("cheerio");

// const parser = new Parser();
// const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// module.exports = async function (context, req) {
//     const feedUrl = "https://medium.com/feed/@ghangas-rakhi";

//     try {
//         // 1. Fetch the RSS Feed to get the list of URLs
//         const response = await axios.get(feedUrl);
//         const feed = await parser.parseString(response.data);

//         if (!connectionString) {
//             throw new Error("Storage Connection String is missing.");
//         }
//         const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
//         const containerClient = blobServiceClient.getContainerClient("medium-blobs");
//         await containerClient.createIfNotExists();

//         const posts = [];

//         for (const item of feed.items) {
//             context.log(`Processing: ${item.title}`);

//             //  Fetch the actual webpage to get FULL text
//             // 2. Fetch the actual webpage with "Browser Headers"
//             let fullArticleText = "";
//             try {
//                 const webPage = await axios.get(item.link, {
//                     headers: {
//                         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//                         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//                         'Accept-Language': 'en-US,en;q=0.5',
//                         'DNT': '1',
//                         'Connection': 'keep-alive',
//                         'Upgrade-Insecure-Requests': '1'
//                     }
//                 });
                
//                 const $ = cheerio.load(webPage.data);
                
//                 // Medium's modern structure often uses 'article' or specific classes
//                 // We'll try a more aggressive selector to grab everything in the story
//                 fullArticleText = $("article").text() || $("section").text() || $(".pw-post-body-paragraph").text();
                
//                 if (!fullArticleText || fullArticleText.length < 500) {
//                     // If scraping failed or was too short, use the content parser as backup
//                     fullArticleText = item.content || item.contentSnippet;
//                 }
//             } catch (e) {
//                 context.log.error(`Failed to scrape ${item.link}: ${e.message}`);
//                 fullArticleText = item.contentSnippet;
//             }

//             // 3. Clean the text for the AI
//             const cleanText = fullArticleText
//                 .replace(/\s+/g, ' ')      
//                 .replace(/&nbsp;/g, ' ')
//                 .replace(/Listen Share.*More/g, '') // Removes Medium UI clutter
//                 .trim();

//             // 4. Map the thumbnail (from the RSS content)
//             let thumbnail = null;
//             const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
//             if (imgMatch) thumbnail = imgMatch[1];

//             const postEntry = {
//                 title: item.title,
//                 link: item.link,
//                 pubDate: item.pubDate,
//                 description: item.contentSnippet, 
//                 thumbnail: thumbnail
//             };
//             posts.push(postEntry);

//             // 5. UPLOAD TO BLOB (JSON structure remains the same!)
//             const blobName = `${item.guid.split('/').pop()}.json`;
//             const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//             const blogData = JSON.stringify({
//                 title: item.title,
//                 link: item.link,
//                 chunk: cleanText, 
//                 timestamp: item.pubDate,
//                 source: "Medium"
//             });

//             await blockBlobClient.upload(blogData, Buffer.byteLength(blogData), {
//                 blobHTTPHeaders: { blobContentType: "application/json" }
//             });
//         }

//         context.res = {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//             body: posts
//         };

//     } catch (error) {
//         context.log.error("Sync Error:", error.message);
//         context.res = {
//             status: 500,
//             body: { error: "Failed to sync blogs", details: error.message }
//         };
//     }
// };
