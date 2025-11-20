// netlify/functions/admin-dashboard.js

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const EVENTS_TABLE = process.env.AIRTABLE_EVENTS_TABLE || "Events";
const SPONSORS_TABLE = process.env.AIRTABLE_SPONSORS_TABLE || "Sponsors";
const ARTISTS_TABLE = process.env.AIRTABLE_ARTISTS_TABLE || "Artists";

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

/**
 * Generic helper to fetch all records from a table (first page only for now).
 * You can add pagination later if needed.
 */
async function fetchTable(tableName, view = "Grid view") {
  const url = `${BASE_URL}/${encodeURIComponent(
    tableName
  )}?view=${encodeURIComponent(view)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Airtable error for table "${tableName}": ${res.status} ${text}`
    );
  }

  const data = await res.json();
  return (data.records || []).map((rec) => ({
    id: rec.id,
    ...rec.fields,
  }));
}

exports.handler = async () => {
  try {
    if (!API_KEY || !BASE_ID) {
      throw new Error(
        "Missing Airtable environment variables (AIRTABLE_API_KEY / AIRTABLE_BASE_ID)."
      );
    }

    const [events, sponsors, artists] = await Promise.all([
      fetchTable(EVENTS_TABLE),
      fetchTable(SPONSORS_TABLE),
      fetchTable(ARTISTS_TABLE),
    ]);

    const approvedEvents = events.filter(
      (e) =>
        String(e.Status || e.status || "").toLowerCase() === "approved"
    );

    const pendingEvents = events.filter(
      (e) =>
        String(e.Status || e.status || "").toLowerCase() === "pending"
    );

    const sponsorLeads = sponsors; // you can filter here later if needed

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        approvedEvents,
        pendingEvents,
        sponsorLeads,
        artists,
      }),
    };
  } catch (err) {
    console.error("Admin dashboard function failed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Failed to load admin dashboard.",
        details: err.message,
      }),
    };
  }
};
