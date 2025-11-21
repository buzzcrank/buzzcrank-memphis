// js/player.js
// Mini player + now-playing metadata for Buzzcrank Revival Live

(function () {
  const STREAM_URL = "https://streaming.live365.com/a26834";

  const root = document.getElementById("miniPlayerRoot");
  if (!root) return;

  // Inject markup so this whole component lives in one file
  root.innerHTML = `
    <div class="mini-player-pill">
      <div class="mini-player-left">
        <div class="mini-eyebrow">Now streaming</div>
        <div class="mini-title-row">
          <div class="mini-stream-title">Buzzcrank Revival Live</div>
          <div class="mini-live-pill">
            <span class="mini-live-dot"></span>
            <span>Live</span>
          </div>
        </div>

        <div class="mini-meta-row">
          <div class="mini-art">
            <img id="npArt" alt="Album art" style="display:none;" />
            <span id="npArtFallback">BC</span>
          </div>
          <div class="mini-track-text">
            <div class="mini-track-title" id="npTitle">
              Loading current track…
            </div>
            <div class="mini-track-artist" id="npArtist">
              Buzzcrank Revival Live
            </div>
          </div>
        </div>
      </div>

      <div class="mini-player-right">
        <audio id="miniAudio" preload="none"></audio>

        <button
          id="miniPlayPause"
          class="icon-button"
          type="button"
          aria-label="Play stream"
        >
          ▶
        </button>

        <div
          id="miniVisualizer"
          class="mini-visualizer"
          aria-hidden="true"
        >
          <span></span><span></span><span></span><span></span>
        </div>

        <input
          id="miniVolume"
          class="mini-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="0.8"
          aria-label="Volume"
        />

        <button
          id="miniMute"
          class="icon-button"
          type="button"
          aria-label="Mute"
        >
          🔈
        </button>

        <button
          id="miniPopout"
          class="icon-button"
          type="button"
          aria-label="Open full player"
        >
          ↗
        </button>
      </div>
    </div>
  `;

  const audio = document.getElementById("miniAudio");
  const playPauseBtn = document.getElementById("miniPlayPause");
  const muteBtn = document.getElementById("miniMute");
  const volSlider = document.getElementById("miniVolume");
  const visualizer = document.getElementById("miniVisualizer");
  const popoutBtn = document.getElementById("miniPopout");

  const npTitleEl = document.getElementById("npTitle");
  const npArtistEl = document.getElementById("npArtist");
  const npArtImg = document.getElementById("npArt");
  const npArtFallback = document.getElementById("npArtFallback");

  if (!audio || !playPauseBtn) return;

  audio.src = STREAM_URL;
  audio.volume = parseFloat(volSlider.value || "0.8");
  let isPlaying = false;

  function setPlayingState(playing) {
    isPlaying = playing;
    playPauseBtn.textContent = playing ? "⏸" : "▶";
    playPauseBtn.setAttribute(
      "aria-label",
      playing ? "Pause stream" : "Play stream"
    );
    if (playing) {
      visualizer.classList.add("playing");
    } else {
      visualizer.classList.remove("playing");
    }
  }

  playPauseBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio
        .play()
        .then(() => setPlayingState(true))
        .catch((err) => {
          console.error("Mini player play() failed", err);
        });
    } else {
      audio.pause();
      setPlayingState(false);
    }
  });

  volSlider.addEventListener("input", () => {
    const v = parseFloat(volSlider.value);
    audio.volume = v;
    muteBtn.textContent = v === 0 || audio.muted ? "🔇" : "🔈";
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔈";
  });

  audio.addEventListener("ended", () => setPlayingState(false));

  // Popout: open full player AND stop mini audio to prevent double-stream
  popoutBtn.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      setPlayingState(false);
    }
    window.open(
      "https://comfy-meerkat-e400e1.netlify.app/buzzcrank-revival-live.html",
      "_blank"
    );
  });

  // Now-playing metadata via Netlify function (uses AzuraCast JSON under the hood)
  async function loadNowPlaying() {
    if (!npTitleEl || !npArtistEl || !npArtImg || !npArtFallback) return;

    try {
      const res = await fetch("/.netlify/functions/nowplaying");
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      const title = data.title || "Buzzcrank Revival Live";
      const artist = data.artist || "Memphis & beyond";
      const art = data.art || "";

      npTitleEl.textContent = title;
      npArtistEl.textContent = artist;

      if (art) {
        npArtImg.src = art;
        npArtImg.style.display = "block";
        npArtFallback.style.display = "none";
      } else {
        npArtImg.style.display = "none";
        npArtFallback.style.display = "block";
      }
    } catch (err) {
      console.error("Failed to load now playing metadata", err);
      // leave existing text in place
    }
  }

  loadNowPlaying();
  setInterval(loadNowPlaying, 30000);
})();
