// js/blog.js
// Load latest posts directly from Blogger JSON feed

(function () {
  const statusEl = document.getElementById("blogStatus");
  const gridEl = document.getElementById("blogGrid");
  if (!statusEl || !gridEl) return;

  const FEED_URL =
    "https://buzzcrank.blogspot.com/feeds/posts/default?alt=json&max-results=5";

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  }

  function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function loadBlog() {
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      const entries = (data.feed && data.feed.entry) || [];
      if (!entries.length) {
        statusEl.innerHTML =
          '<span class="dot"></span><span>No posts yet — check back soon or read directly on <a href="https://buzzcrank.blogspot.com" target="_blank" rel="noopener">buzzcrank.blogspot.com</a>.</span>';
        gridEl.innerHTML = "";
        return;
      }

      statusEl.innerHTML =
        '<span class="dot" style="background:#32ff9b;"></span>' +
        '<span>Latest from buzzcrank.blogspot.com</span>';

      gridEl.innerHTML = "";
      entries.slice(0, 3).forEach((entry) => {
        const title = entry.title && entry.title.$t ? entry.title.$t : "Untitled";
        const published =
          (entry.published && entry.published.$t) ||
          (entry.updated && entry.updated.$t);
        const content =
          (entry.summary && entry.summary.$t) ||
          (entry.content && entry.content.$t) ||
          "";
        const snippet = stripHtml(content).slice(0, 180) + (content.length > 180 ? "…" : "");

        const altLink =
          (entry.link || []).find((l) => l.rel === "alternate") || {};
        const url = altLink.href || "https://buzzcrank.blogspot.com";

        const card = document.createElement("article");
        card.className = "blog-card";
        card.innerHTML = `
          <div class="blog-title">${title}</div>
          <div class="blog-meta">${formatDate(published)}</div>
          <div class="blog-snippet">${snippet}</div>
          <a class="blog-link" href="${url}" target="_blank" rel="noopener">
            Read more →
          </a>
        `;
        gridEl.appendChild(card);
      });
    } catch (err) {
      console.error("Blog load failed", err);
      statusEl.innerHTML =
        '<span class="dot"></span>' +
        '<span>Couldn’t load posts. You can still read the blog directly on ' +
        '<a href="https://buzzcrank.blogspot.com" target="_blank" rel="noopener">buzzcrank.blogspot.com</a>.</span>';
    }
  }

  loadBlog();
})();
