// netlify/functions/blog.js

const BLOGGER_FEED_URL =
  "http://www.buzzcrank.blogspot.com/feeds/posts/default?alt=json&max-results=3";

exports.handler = async function (event, context) {
  try {
    const response = await fetch(BLOGGER_FEED_URL);

    const text = await response.text(); // pass through raw JSON string

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (err) {
    console.error("Error fetching Blogger feed:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to fetch blog feed",
        details: err.message,
      }),
    };
  }
};
