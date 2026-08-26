console.log("Starting the player app application");

const maxZ = 2147483647;
let snapshots = [];
let activeIframe = null;
let currentUrl = window.location.href;

const biggestBox = document.createElement("div");
biggestBox.id = "biggestBox";
const theBoxShadow = biggestBox.attachShadow({ mode: "open" });
const design = document.createElement("style");
const theRealContainer = document.createElement("div");
theRealContainer.id = "theRealContainer";

biggestBox.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: ${maxZ};
`;
theRealContainer.innerHTML = `
    <div class="controls" id="ui-controls">
        <button id="ui-theme-btn">Light Mode</button>
    </div>
    <div id="ui-container">
        <div class="brand">
            <svg viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
        </div>

        <div class="slider-wrapper">
            <span class="slider-label">Past</span>
            <input type="range" id="ui-slider" min="0" max="0" value="0" disabled>
            <span class="slider-label">Now</span>
        </div>

        <div id="ui-display" class="loading">Loading</div>
    </div>
`;
design.textContent = `
    :host {
        --ui-bg: rgba(20, 15, 32, 0.75);
        --ui-text: rgb(243, 240, 255);
        --ui-text-muted: rgb(185, 174, 214);
        --ui-border: rgba(139, 92, 246, 0.2);
        --ui-accent: rgb(168, 85, 247);
        --ui-glass-blur: blur(10px);
        --ui-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    :host(.light-mode) {
        --ui-bg: rgba(250, 248, 255, 0.85);
        --ui-text: rgb(46, 35, 64);
        --ui-text-muted: #6b5c8c;
        --ui-border: rgba(124, 58, 237, 0.15);
        --ui-accent: rgb(124, 58, 237);
        --ui-accent-hover: rgb(109, 40, 217);
        --ui-shadow: 0 8px 32px rgba(124, 58, 237, 0.15);
    }

    #theRealContainer {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        pointer-events: none;
        z-index: 2;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .controls {
        display: flex;
        gap: 10px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host(:hover) .controls, .controls.active {
        opacity: 1;
        transform: translateY(0);
    }

    button {
        background: var(--ui-bg);
        backdrop-filter: var(--ui-glass-blur);
        border: 1px solid var(--ui-border);
        color: var(--ui-text-muted);
        padding: 6px 14px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: all 0.2s ease;
    }

    button:hover {
        background: var(--ui-accent);
        color: #fff;
        border-color: var(--ui-accent);
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
    }

    #ui-container {
        width: 85vw;
        max-width: 750px;
        background: var(--ui-bg);
        backdrop-filter: var(--ui-glass-blur);
        -webkit-backdrop-filter: var(--ui-glass-blur);
        padding: 16px 24px;
        border-radius: 24px;
        border: 1px solid var(--ui-border);
        box-shadow: var(--ui-shadow);
        display: flex;
        align-items: center;
        justify-content: space-between;
        pointer-events: auto;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;    
    }

    #ui-container.collapsed {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
      pointer-events: none;
    }

    .brad {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ui-accent);
    }

    .brand svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    #ui-display {
        min-width: 140px;
        text-align: center;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 13px;
        font-weight: 700;
        background: rgba(168, 85, 247, 0.1);
        color: var(--ui-accent);
        padding: 8px 12px;
        border-radius: 12px;
        border: 1px solid rgba(168, 85, 247, 0.2);
        transition: all 0.3s ease;
    }

    #ui-display.loading {
        animation: pulse 1.5s infinite;
        color: var(--ui-text-muted);
        background: transparent;
        border-color: var(--ui-border);
    }

    @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
    }

    .slider-wrapper{
        display: flex;
        align-items: center;
        justify-content: center;
        flex-grow: 1;
        gap: 16px;
        margin: 0 32px;
    }

    .slider-label {
        font-size: 11px;
        color: var(--ui-text-muted);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        white-space: nowrap;
    }

    input[type=range] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        cursor: pointer;
    }

    input[type=range]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        background: var(--ui-border);
        border-radius: 10px;
        transition: all 0.2s;
    }

    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--ui-accent);
        margin-top: -7px;
        box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
        transition: transform 0.1s, background 0.2s;
        border: 2px solid #fff;
    }

    input[type=range]:active::-webkit-slider-thumb {
        transform: scale(1.2);
        background: var(--ui-accent-hover);
    }

    .iframe-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #fff;
        z-index: 1;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s ease;
    }
    .iframe-overlay.active {opacity: 1; pointer-events: auto;}
`;

theBoxShadow.appendChild(design);
theBoxShadow.appendChild(theRealContainer);

const startFakeUI = () => {
    if (document.body) document.body.appendChild(biggestBox);
    else requestAnimationFrame(startFakeUI);
};
startFakeUI();
const slider = theBoxShadow.getElementById("ui-slider");
const display = theBoxShadow.getElementById("ui-display");
const uiContainer = theBoxShadow.getElementById("ui-container");
const themeBtn = theBoxShadow.getElementById("ui-theme-btn");
const controls = theBoxShadow.getElementById("ui-controls");

themeBtn.addEventListener("click", () => {
  biggestBox.classList.toggle("light-mode");
  themeBtn.innerText = biggestBox.classList.contains("light-mode") ? "Dark Mode" : "Light Mode";
});

function formatTimestamp(timestamp) {
  if (!timestamp) return "00:00:00";
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function removeActiveIframeBoi() {
  if (activeIframe) {
    activeIframe.style.opacity ="0";
    setTimeout(() => {
      if (activeIframe) {
        activeIframe.remove();
        activeIframe = null;
      }
    }, 400);
  }
}

function updateDisplayBoi(text, red = false) {
  display.innerText = text;
  display.classList.remove("loading");
  display.style.background = red ? "rgba(255, 71, 87, 0.1)" : "rgba(168, 85, 247, 0.1)";
  display.style.borderColor = red ? "rgba(255, 71, 87, 0.3)" : "rgba(168, 85, 247, 0.2)";
  display.style.color = red ? "rgb(255, 71, 87)" : "var(--ui-accent)";
}

function setDisplayLoadingBoi() {
  display.innerText = "Scanning";
  display.classList.add("loading");
  display.style.color = "";
  display.style.background = "";
  display.style.borderColor = "";
}

function showRetryBoi(targetUrl) {
  let retryBtn = theBoxShadow.getElementById("ui-retry-btn");
  if (!retryBtn) {
    retryBtn = document.createElement("button");
    retryBtn.id = "ui-retry-btn";
    retryBtn.innerText = "Try Again Boi";
    retryBtn.style.marginLeft = "10px";
    theRealContainer.querySelector(".controls").appendChild(retryBtn);
    retryBtn.addEventListener("click", () => {
      retryBtn.remove();
      loadSnapshotsBoi(targetUrl);
    });
  }
}

function loadSnapshotsBoi(targetUrl) {
  setDisplayLoadingBoi();
  slider.disabled = true;
  removeActiveIframeBoi();
  try {
    chrome.runtime.sendMessage({action:"FETCH_SNAPSHOTS", url: targetUrl,}, (response) => {
      if (chrome.runtime.lastError||!response) {
        updateDisplayBoi("Extension has Error Boi", true);
        return;
      }

      if (response.success) {
        if (response.timestamps.length > 0) {
          snapshots = response.timestamps;
          slider.disabled = false;
          slider.min = 0;
          slider.max = snapshots.length;
          slider.value = snapshots.length;
          updateDisplayBoi(`Found ${snapshots.length} Bo`);
        } else {
          updateDisplayBoi("No snapshots found (not Archived)", true);
          slider.disabled = true;
          slider.value=0;
          slider.max=0;
        }
      } else {
        updateDisplayBoi("API Overloaded Boi", true);
        showRetryBoi(targetUrl);
      }
    });
  } catch (e) {
    console.error("TimeWarp: please refresh Boi.", e);
    updateDisplayBoi("Please refresh Boi", true);
  }
}

loadSnapshotsBoi(currentUrl);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "URL_CHANGED" && request.url !== currentUrl) {
    currentUrl = request.url;
    loadSnapshotsBoi(currentUrl);
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "OPEN_COMPARE") openCompareBoi(request.t1, request.t2, request.url);
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "HIDE_UI") biggestBox.style.display = "none";
  if (request.action === "SHOW_UI") biggestBox.style.display = "";
});

let compareBox = null;

function fmtCmp(ts) {
  const y = ts.substring(0, 4), m = ts.substring(4, 6), d = ts.substring(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
}

function openCompareBoi(t1, t2, url) {
  if (compareBox) compareBox.remove();
  compareBox = document.createElement("div");
  compareBox.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 2147483646; background: #0d0a14; display: flex; flex-direction: column;
    pointer-events: auto; font-family: 'Inter', system-ui, sans-serif;
  `;
  compareBox.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center; padding:10px 14px; background:rgba(20,15,31,0.95);">
      <button id="cmp-close" style="background:rgb(168,85,247);color:#fff;border:none;padding:8px 14px;border-radius:16px;cursor:pointer;font-weight:700;text-transform:uppercase;font-size:11px;">close boi</button>
      <button id="cmp-blend" style="background:transparent;border:1px solid rgba(139,92,246,0.4);color:rgb(185,174,214);padding:8px 14px;border-radius:16px;cursor:pointer;font-weight:700;text-transform:uppercase;font-size:11px;">blend diff</button>
      <span style="color:rgb(185,174,214);font-size:12px;margin-left:auto;">start ${fmtCmp(t1)} &nbsp;→&nbsp; end ${fmtCmp(t2)}</span>
    </div>
    <div id="cmp-stage" style="position:relative; flex:1; display:flex; overflow:hidden;">
      <iframe id="cmp-a" style="flex:1; border:none; width:50%; height:100%;"></iframe>
      <iframe id="cmp-b" style="flex:1; border:none; width:50%; height:100%;"></iframe>
      <iframe id="cmp-blendframe" style="display:none; position:absolute; top:0; left:50%; width:50%; height:100%; border:none; mix-blend-mode:difference;"></iframe>
    </div>
  `;
  document.documentElement.appendChild(compareBox);
  const a = compareBox.querySelector("#cmp-a");
  const b = compareBox.querySelector("#cmp-b");
  const blend = compareBox.querySelector("#cmp-blendframe");
  a.src = `https://web.archive.org/web/${t1}id_/${url}`;
  b.src = `https://web.archive.org/web/${t2}id_/${url}`;
  let blended = false;
  compareBox.querySelector("#cmp-close").addEventListener("click", () => { compareBox.remove(); compareBox = null; });
  compareBox.querySelector("#cmp-blend").addEventListener("click", () => {
    blended = !blended;
    blend.style.display = blended ? "block" : "none";
    if (blended) blend.src = `https://web.archive.org/web/${t2}id_/${url}`;
  });
}

slider.addEventListener("change", (echange) => {
  const idx = parseInt(echange.target.value);

  if (idx === snapshots.length) {
    updateDisplayBoi("Today Boi");
    removeActiveIframeBoi();
  } else {
    const selectedTimestamp = snapshots[idx];
    updateDisplayBoi(formatTimestamp(selectedTimestamp));

    if (!activeIframe) {
      activeIframe = document.createElement("iframe");
      activeIframe.className = "iframe-overlay";
      activeIframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: none;
        z-index: 2147483646;
        background: #fff;
        pointer-events: auto;
      `;
      document.documentElement.appendChild(activeIframe);
      activeIframe.addEventListener("load", () => console.log("TimeWarp: archive frame loaded boi"));

      setTimeout(() => {
        if (activeIframe) activeIframe.style.opacity = "1";
      }, 50);
    } else {
      activeIframe.style.opacity = "1";
    }

    const archiveUrl = `https://web.archive.org/web/${selectedTimestamp}if_/${currentUrl}`;
    activeIframe.src = chrome.runtime.getURL(
      `warp.html?url=${encodeURIComponent(archiveUrl)}`,
    );
  }
});

slider.addEventListener("input", (e) => {
  const idx = parseInt(e.target.value);
  if (idx === snapshots.length) {
    updateDisplayBoi("Today Boi");
  } else {
    updateDisplayBoi(formatTimestamp(snapshots[idx]));
  }
});