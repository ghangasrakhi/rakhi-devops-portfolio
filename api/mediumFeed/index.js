const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const Parser = require("rss-parser");
const parser = new Parser();

const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const SEARCH_ENDPOINT = "https://medium-chatsearch.search.windows.net";
const INDEX_NAME = "medium-blogs";

let searchClient;
if (AZURE_SEARCH_KEY) {
    searchClient = new SearchClient(
        SEARCH_ENDPOINT,
        INDEX_NAME,
        new AzureKeyCredential(AZURE_SEARCH_KEY)
    );
} else {
    console.warn("AZURE_SEARCH_KEY is missing!");
}

module.exports = async function (context, req) {
    const mediumRSS = "https://medium.com/feed/@ghangas-rakhi";

    try {
        // Fetch Medium RSS feed
        const feed = await parser.parseURL(mediumRSS);
        context.log("Feed items found:", feed.items.length);

        const posts = feed.items.slice(0, 6).map(item => ({
            id: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            thumbnail: item.enclosure ? item.enclosure.url : "https://example.com/default.jpg",
            content: item.contentSnippet || ""
        }));

        context.log("Posts prepared:", posts.length);

        // Try sending to Azure Search, but fail gracefully
        if (searchClient) {
            try {
                const result = await searchClient.uploadDocuments(posts);
                context.log("Azure Search upload result:", result);
            } catch (searchError) {
                context.log("Azure Search failed:", searchError.message);
            }
        } else {
            context.log("Skipping Azure Search: key not set.");
        }

        // Always return posts to the front-end
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: posts
        };
    } catch (err) {
        context.log("Function error:", err);
        context.res = {
            status: 200, // Return 200 so the front-end still gets something
            headers: { "Content-Type": "application/json" },
            body: { error: "Failed to fetch Medium posts", details: err.message }
        };
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

// sadnmcsabf