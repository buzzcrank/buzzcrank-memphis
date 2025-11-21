// js/blog.js
// Buzzcrank Memphis – Blog section loader
// Uses Blogger's HTTPS JSON feed to avoid mixed-content issues.

const BLOG_FEED_URL =
  "https://buzzcrank.blogspot.com/feeds/posts/default?alt=json";

// How many posts to show
const MAX_POSTS = 3;

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadBlogPosts() {
  const statusEl = document.getElementById("blogStatus");
  const listEl = document.getElementById("blogList");

  if (!statusEl || !listEl) return; // section not on this page

  // Initial message
  statusEl.textContent = "Loading latest posts from the Buzzcrank blog…";

  try {
    const res = await fetch(BLOG_FEED_URL);
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    const entries = (data.feed && data.feed.entry) || [];

    if (!entries.length) {
      statusEl.innerHTML =
        'No posts yet — check back soon or read directly on <a href="https://buzzcrank.blogspot.com/" target="_blank" rel="noopener noreferrer">buzzcrank.blogspot.com</a>.';
      listEl.innerHTML = "";
      return;
    }

    // Success message
    statusEl.textContent = "";

    listEl.innerHTML = "";

    entries.slice(0, MAX_POSTS).forEach((entry) => {
      const title = entry.title?.$t || "Untitled post";
      const published = entry.published?.$t || "";
      const dateStr = formatDate(published);

      const altLink =
        (entry.link || []).find((l) => l.rel === "alternate")?.href ||
        "https://buzzcrank.blogspot.com/";

      const bodySource = entry.summary || entry.content;
      const rawSnippet = bodySource ? bodySource.$t || "" : "";
      let snippet = stripHtml(rawSnippet).trim();
      if (snippet.length > 220) {
        snippet = snippet.slice(0, 217) + "…";
      }

      const card = document.createElement("article");
      card.className = "blog-card";

      card.innerHTML = `
        <h3 class="blog-title">
          <a href="${altLink}" target="_blank" rel="noopener noreferrer">${title}</a>
        </h3>
        <p class="blog-meta">${dateStr}</p>
        <p class="blog-snippet">${snippet}</p>
        <a class="blog-readmore" href="${altLink}" target="_blank" rel="noopener noreferrer">
          Read full story →
        </a>
      `;

      listEl.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load Buzzcrank blog posts:", err);
    statusEl.innerHTML =
      'Couldn\'t load posts. You can still read the blog directly on <a href="https://buzzcrank.blogspot.com/" target="_blank" rel="noopener noreferrer">buzzcrank.blogspot.com</a>.';
    // Keep list empty on error
    if (typeof listEl !== "undefined") listEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", loadBlogPosts);
