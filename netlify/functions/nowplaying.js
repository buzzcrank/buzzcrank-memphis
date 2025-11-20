// netlify/functions/nowplaying.js

const AZURACAST_NOWPLAYING_URL =
  process.env.AZURACAST_NOWPLAYING_URL ||
  "https://207.148.31.45/api/nowplaying/fall_festival"; // <-- adjust if needed

exports.handler = async () => {
  try {
    if (!AZURACAST_NOWPLAYING_URL) {
      throw new Error("AZURACAST_NOWPLAYING_URL is not configured.");
    }

    const res = await fetch(AZURACAST_NOWPLAYING_URL);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upstream error ${res.status}: ${txt}`);
    }

    let data = await res.json();

    // If array, use first element
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    // Try to match AzuraCast-like structure
    const np = data.now_playing || data.nowPlaying || data;
    const song = np.song || np.current_song || np;

    const title =
      song.title || song.name || song.text || "Buzzcrank Revival Live";
    const artist =
      song.artist || song.artist_name || song.artistText || "Memphis & beyond";
    const art =
      song.art ||
      song.cover ||
      song.album_art ||
      ""; // ok if this is empty, frontend will handle

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ title, artist, art }),
    };
  } catch (err) {
    console.error("nowplaying error:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to load now playing",
        details: err.message,
      }),
    };
  }
};
