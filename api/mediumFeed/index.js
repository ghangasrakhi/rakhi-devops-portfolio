
const Parser = require("rss-parser");
const parser = new Parser();

module.exports = async function (context, req) {
  try {

    const feed = await parser.parseURL(
      "https://medium.com/feed/@ghangas-rakhi"
    );

    const posts = feed.items.slice(0, 5).map(post => {

      // extract image from content
      let thumbnail = null;
      const match = post.content.match(/<img[^>]+src="([^">]+)"/);

      if (match && match[1]) {
        thumbnail = match[1];
      }

      return {
        title: post.title,
        link: post.link,
        pubDate: post.pubDate,
        description: post.contentSnippet,
        thumbnail: thumbnail
      };
    });

    context.res = {
      status: 200,
      body: posts
    };

  } catch (error) {

    context.res = {
      status: 500,
      body: {
        error: "Failed to fetch Medium posts",
        details: error.message
      }
    };
  }
};

