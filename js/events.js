// js/events.js
// Loads events from your Netlify function and fills #eventsList

(async function loadEvents() {
  const statusEl = document.getElementById("eventsStatus");
  const listEl = document.getElementById("eventsList");

  if (!statusEl || !listEl) return;

  try {
    const res = await fetch("/.netlify/functions/events");
    if (!res.ok) throw new Error("Network response not ok");

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      statusEl.innerHTML =
        '<span class="dot"></span><span>No events in the calendar yet — submit your show to get listed.</span>';
      listEl.innerHTML = "";
      return;
    }

    statusEl.innerHTML =
      '<span class="dot"></span><span>Live feed synced. Here’s what’s coming up.</span>';

    listEl.innerHTML = "";
    data.forEach((ev) => {
      const li = document.createElement("li");
      li.className = "event-item";

      const title = ev.title || "Untitled event";
      const date = ev.date || "";
      const time = ev.time || "";
      const venue = ev.venue || "";
      const city = ev.city || "";
      const tags = Array.isArray(ev.tags) ? ev.tags : [];
      const links = Array.isArray(ev.links) ? ev.links : [];

      const mainCol = document.createElement("div");
      const whenCol = document.createElement("div");
      const ctaCol = document.createElement("div");

      mainCol.innerHTML = `
        <div class="event-main-title">${title}</div>
        <div class="event-meta">
          ${venue ? venue : ""}${venue && city ? " • " : ""}${city ? city : ""}
        </div>
        ${
          tags.length
            ? `<div class="event-tags">${tags.map((t) => "#" + t).join("  ")}</div>`
            : ""
        }
      `;

      whenCol.innerHTML = `
        <div class="event-when">${date}</div>
        <div class="event-meta">${time}</div>
      `;

      if (links.length > 0 && links[0].url) {
        const btn = document.createElement("button");
        btn.className = "event-link-btn";
        btn.type = "button";
        btn.textContent = links[0].label || "View details";
        btn.addEventListener("click", () => {
          window.open(links[0].url, "_blank");
        });
        ctaCol.appendChild(btn);
      }

      li.appendChild(mainCol);
      li.appendChild(whenCol);
      li.appendChild(ctaCol);
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load events", err);
    statusEl.innerHTML =
      '<span class="dot" style="background:#ff5b7a;box-shadow:none;"></span>' +
      '<span>Couldn’t reach the event feed. Try refreshing in a moment.</span>';
  }
})();
